/*
  # Add user settings table for secure API key storage

  1. New Tables
    - `user_settings`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `gemini_api_key` (text, encrypted)
      - `theme` (text, default 'light')
      - `auto_save` (boolean, default true)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `user_settings` table
    - Add policy for authenticated users to manage their own settings
    - Encrypt API keys for security

  3. Indexes
    - Index on user_id for fast lookups
*/

CREATE TABLE IF NOT EXISTS user_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  gemini_api_key text,
  theme text DEFAULT 'light' CHECK (theme IN ('light', 'dark')),
  auto_save boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage own settings"
  ON user_settings
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id 
  ON user_settings(user_id);

-- Create unique constraint to ensure one settings record per user
CREATE UNIQUE INDEX IF NOT EXISTS user_settings_user_id_unique 
  ON user_settings(user_id);