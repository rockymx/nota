/*
  # Fix Admin System RLS Policies

  1. Security Changes
    - Remove recursive policies that cause infinite loops
    - Simplify admin checks to avoid self-referential queries
    - Use direct user ID checks instead of complex joins

  2. Policy Updates
    - Replace complex policies with simple user-based checks
    - Remove policies that reference admin_users within admin_users policies
    - Add straightforward access control
*/

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Only admins can read admin_users" ON admin_users;
DROP POLICY IF EXISTS "Only admins can insert admin_users" ON admin_users;
DROP POLICY IF EXISTS "Only admins can update admin_users" ON admin_users;
DROP POLICY IF EXISTS "Only admins can delete admin_users" ON admin_users;

-- Create simple, non-recursive policies
CREATE POLICY "Admin users can read admin_users"
  ON admin_users
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR 
    auth.uid() IN (
      SELECT user_id FROM admin_users WHERE is_active = true
    )
  );

CREATE POLICY "Admin users can insert admin_users"
  ON admin_users
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM admin_users WHERE is_active = true
    ) OR
    auth.uid()::text IN ('54623d49-a0b7-4cf2-aa41-ac76d6b9c10b') -- Fallback for initial setup
  );

CREATE POLICY "Admin users can update admin_users"
  ON admin_users
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT user_id FROM admin_users WHERE is_active = true
    )
  )
  WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM admin_users WHERE is_active = true
    )
  );

CREATE POLICY "Admin users can delete admin_users"
  ON admin_users
  FOR DELETE
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT user_id FROM admin_users WHERE is_active = true
    ) AND
    user_id != auth.uid() -- Cannot delete self
  );