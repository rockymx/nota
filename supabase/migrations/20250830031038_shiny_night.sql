/*
  # Add hidden prompts functionality

  1. New Tables
    - `hidden_prompts`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `prompt_id` (uuid, foreign key to ai_prompts)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `hidden_prompts` table
    - Add policy for users to manage their own hidden prompts

  3. Purpose
    - Allow users to hide default prompts from the dropdown selector
    - Maintain flexibility to show/hide prompts as needed
*/

CREATE TABLE IF NOT EXISTS hidden_prompts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  prompt_id uuid NOT NULL REFERENCES ai_prompts(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, prompt_id)
);

ALTER TABLE hidden_prompts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own hidden prompts"
  ON hidden_prompts
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_hidden_prompts_user_id ON hidden_prompts(user_id);
CREATE INDEX IF NOT EXISTS idx_hidden_prompts_prompt_id ON hidden_prompts(prompt_id);