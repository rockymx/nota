/*
  # Create admin system

  1. New Tables
    - `admin_users`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `created_at` (timestamp)
      - `is_active` (boolean, default true)
      - `created_by` (uuid, references auth.users)

  2. Security
    - Enable RLS on `admin_users` table
    - Add policies for admin users to manage other admins
    - Add function to check if user is admin

  3. Views
    - Create view for user statistics
    - Create view for admin dashboard data
*/

-- Create admin_users table
CREATE TABLE IF NOT EXISTS admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES auth.users(id),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Create function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_uuid uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_users 
    WHERE user_id = user_uuid AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create policies for admin_users table
CREATE POLICY "Admins can view all admin records"
  ON admin_users
  FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can create new admins"
  ON admin_users
  FOR INSERT
  TO authenticated
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update admin records"
  ON admin_users
  FOR UPDATE
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can delete admin records"
  ON admin_users
  FOR DELETE
  TO authenticated
  USING (is_admin(auth.uid()));

-- Create view for user statistics (only accessible by admins)
CREATE OR REPLACE VIEW admin_user_stats AS
SELECT 
  u.id,
  u.email,
  u.created_at as registered_at,
  COALESCE(note_count.count, 0) as total_notes,
  COALESCE(folder_count.count, 0) as total_folders,
  COALESCE(prompt_count.count, 0) as custom_prompts,
  latest_note.last_activity
FROM users u
LEFT JOIN (
  SELECT user_id, COUNT(*) as count
  FROM notes
  GROUP BY user_id
) note_count ON u.id = note_count.user_id
LEFT JOIN (
  SELECT user_id, COUNT(*) as count
  FROM folders
  GROUP BY user_id
) folder_count ON u.id = folder_count.user_id
LEFT JOIN (
  SELECT user_id, COUNT(*) as count
  FROM ai_prompts
  WHERE is_default = false
  GROUP BY user_id
) prompt_count ON u.id = prompt_count.user_id
LEFT JOIN (
  SELECT user_id, MAX(updated_at) as last_activity
  FROM notes
  GROUP BY user_id
) latest_note ON u.id = latest_note.user_id
ORDER BY u.created_at DESC;

-- Enable RLS on the view
ALTER VIEW admin_user_stats SET (security_barrier = true);

-- Create policy for the view
CREATE POLICY "Only admins can view user stats"
  ON admin_user_stats
  FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_admin_users_user_id ON admin_users(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_users_is_active ON admin_users(is_active);

-- Insert first admin user (current user if authenticated)
DO $$
BEGIN
  IF auth.uid() IS NOT NULL THEN
    INSERT INTO admin_users (user_id, created_by)
    VALUES (auth.uid(), auth.uid())
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
END $$;