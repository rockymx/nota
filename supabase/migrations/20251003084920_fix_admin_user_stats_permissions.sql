/*
  # Fix admin_user_stats view permissions
  
  1. Problem
    - The view `admin_user_stats` exists but lacks proper GRANT permissions
    - Supabase client queries fail with "admin_user_stats is not a table" error
    - This happens because RLS/permissions aren't configured for the view
  
  2. Solution
    - Grant SELECT permission on admin_user_stats view to authenticated users
    - This allows admins to query the view through the Supabase client
  
  3. Security
    - Only authenticated admin users with proper email should access this view
    - The view itself is read-only by design
*/

-- Grant SELECT permission on the admin_user_stats view
GRANT SELECT ON admin_user_stats TO authenticated;

-- Also grant usage on the public schema if not already granted
GRANT USAGE ON SCHEMA public TO authenticated;
