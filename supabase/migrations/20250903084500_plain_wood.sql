/*
  # Add specific admin user

  1. Purpose
    - Add 2dcommx01@gmail.com as admin user
    - Ensure both admin emails are recognized
    - Create user record if doesn't exist

  2. Security
    - Only affects specific admin emails
    - Maintains existing RLS policies
    - Safe upsert operations
*/

-- Function to create admin user if email matches
CREATE OR REPLACE FUNCTION ensure_admin_users()
RETURNS void AS $$
BEGIN
  -- Insert admin emails into users table if they don't exist
  INSERT INTO users (id, email, created_at, updated_at)
  SELECT 
    gen_random_uuid(),
    email,
    now(),
    now()
  FROM (
    VALUES 
      ('2dcommx02@gmail.com'),
      ('2dcommx01@gmail.com')
  ) AS admin_emails(email)
  WHERE NOT EXISTS (
    SELECT 1 FROM users WHERE users.email = admin_emails.email
  );

  -- Make sure these users are admins
  INSERT INTO admin_users (user_id, created_by, is_active)
  SELECT 
    u.id,
    u.id,
    true
  FROM users u
  WHERE u.email IN ('2dcommx02@gmail.com', '2dcommx01@gmail.com')
  ON CONFLICT (user_id) DO UPDATE SET
    is_active = true,
    created_at = COALESCE(admin_users.created_at, now());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Execute the function
SELECT ensure_admin_users();