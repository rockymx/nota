/*
  # Fix infinite recursion in admin_users policies

  1. Problem
    - Current policies reference admin_users table within their own conditions
    - This creates infinite recursion when evaluating permissions
    - Prevents any operations on admin_users table

  2. Solution
    - Drop existing recursive policies
    - Create new policies that use auth.email() and auth.uid() directly
    - Allow specific admin emails to manage admin_users without table self-reference
    - Use hardcoded email list to break recursion cycle

  3. Security
    - Only specific emails can manage admin_users
    - Users can only manage their own admin record
    - No circular dependencies in policy evaluation
*/

-- Drop all existing policies that cause recursion
DROP POLICY IF EXISTS "Admin users can delete admin_users" ON public.admin_users;
DROP POLICY IF EXISTS "Admin users can insert admin_users" ON public.admin_users;
DROP POLICY IF EXISTS "Admin users can read admin_users" ON public.admin_users;
DROP POLICY IF EXISTS "Admin users can update admin_users" ON public.admin_users;

-- Create new non-recursive policies using auth.email() directly
CREATE POLICY "Allow admin emails to read admin_users"
  ON public.admin_users
  FOR SELECT
  TO authenticated
  USING (
    auth.email() IN ('2dcommx02@gmail.com', '2dcommx01@gmail.com')
    OR user_id = auth.uid()
  );

CREATE POLICY "Allow admin emails to insert admin_users"
  ON public.admin_users
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.email() IN ('2dcommx02@gmail.com', '2dcommx01@gmail.com')
    AND user_id = auth.uid()
  );

CREATE POLICY "Allow admin emails to update admin_users"
  ON public.admin_users
  FOR UPDATE
  TO authenticated
  USING (
    auth.email() IN ('2dcommx02@gmail.com', '2dcommx01@gmail.com')
  )
  WITH CHECK (
    auth.email() IN ('2dcommx02@gmail.com', '2dcommx01@gmail.com')
  );

CREATE POLICY "Allow admin emails to delete admin_users"
  ON public.admin_users
  FOR DELETE
  TO authenticated
  USING (
    auth.email() IN ('2dcommx02@gmail.com', '2dcommx01@gmail.com')
    AND user_id != auth.uid()  -- Prevent self-deletion
  );