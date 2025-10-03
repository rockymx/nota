/*
  # Fix admin_users INSERT policy
  
  1. Problem
    - Current INSERT policy requires user_id = auth.uid() AND email in admin list
    - This prevents admin users from inserting themselves into admin_users table
    - The condition is too restrictive and contradictory
  
  2. Solution
    - Allow admin emails to insert ANY user (for adding other admins)
    - Allow users to insert themselves IF they are admin emails
    - Simplify the policy to just check if the authenticated user's email is in the admin list
  
  3. Security
    - Only users with admin emails can insert records
    - This allows them to self-register as admins
    - Still maintains security by restricting to specific email addresses
*/

-- Drop the problematic INSERT policy
DROP POLICY IF EXISTS "Allow admin emails to insert admin_users" ON public.admin_users;

-- Create new INSERT policy that allows admin emails to insert
CREATE POLICY "Allow admin emails to insert admin_users"
  ON public.admin_users
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.email() IN ('2dcommx02@gmail.com', '2dcommx01@gmail.com')
  );
