/*
  # Sistema de Administrador

  1. New Tables
    - `admin_users`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `is_active` (boolean, default true)
      - `created_by` (uuid, nullable)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Views
    - `admin_user_stats` - Vista con estadísticas de usuarios para el dashboard

  3. Security
    - Enable RLS on `admin_users` table
    - Add policies for admin access only
    - Create view for user statistics

  4. Initial Data
    - Insert admin users for specified emails
*/

-- Crear tabla de administradores
CREATE TABLE IF NOT EXISTS admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Crear índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_admin_users_user_id ON admin_users(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_users_active ON admin_users(is_active);

-- Crear constraint único para evitar duplicados
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'admin_users_user_id_unique' 
    AND table_name = 'admin_users'
  ) THEN
    ALTER TABLE admin_users ADD CONSTRAINT admin_users_user_id_unique UNIQUE (user_id);
  END IF;
END $$;

-- Habilitar RLS
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad para admin_users
CREATE POLICY IF NOT EXISTS "Only admins can read admin_users"
  ON admin_users
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users au 
      WHERE au.user_id = auth.uid() 
      AND au.is_active = true
    )
  );

CREATE POLICY IF NOT EXISTS "Only admins can insert admin_users"
  ON admin_users
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users au 
      WHERE au.user_id = auth.uid() 
      AND au.is_active = true
    )
  );

CREATE POLICY IF NOT EXISTS "Only admins can update admin_users"
  ON admin_users
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users au 
      WHERE au.user_id = auth.uid() 
      AND au.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users au 
      WHERE au.user_id = auth.uid() 
      AND au.is_active = true
    )
  );

CREATE POLICY IF NOT EXISTS "Only admins can delete admin_users"
  ON admin_users
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users au 
      WHERE au.user_id = auth.uid() 
      AND au.is_active = true
    )
  );

-- Crear vista para estadísticas de usuarios
CREATE OR REPLACE VIEW admin_user_stats AS
SELECT 
  u.id,
  u.email,
  u.created_at as registered_at,
  COALESCE(note_counts.total_notes, 0) as total_notes,
  COALESCE(folder_counts.total_folders, 0) as total_folders,
  COALESCE(prompt_counts.custom_prompts, 0) as custom_prompts,
  GREATEST(
    note_counts.last_note_activity,
    folder_counts.last_folder_activity,
    prompt_counts.last_prompt_activity
  ) as last_activity
FROM users u
LEFT JOIN (
  SELECT 
    user_id,
    COUNT(*) as total_notes,
    MAX(updated_at) as last_note_activity
  FROM notes 
  GROUP BY user_id
) note_counts ON u.id = note_counts.user_id
LEFT JOIN (
  SELECT 
    user_id,
    COUNT(*) as total_folders,
    MAX(created_at) as last_folder_activity
  FROM folders 
  GROUP BY user_id
) folder_counts ON u.id = folder_counts.user_id
LEFT JOIN (
  SELECT 
    user_id,
    COUNT(*) as custom_prompts,
    MAX(updated_at) as last_prompt_activity
  FROM ai_prompts 
  WHERE is_default = false
  GROUP BY user_id
) prompt_counts ON u.id = prompt_counts.user_id
ORDER BY u.created_at DESC;

-- Función para crear usuarios administradores automáticamente
CREATE OR REPLACE FUNCTION create_admin_user_if_not_exists(admin_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  target_user_id uuid;
BEGIN
  -- Buscar el usuario por email
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email = admin_email;

  -- Si el usuario existe, agregarlo como admin si no lo es ya
  IF target_user_id IS NOT NULL THEN
    INSERT INTO admin_users (user_id, created_by, is_active)
    VALUES (target_user_id, target_user_id, true)
    ON CONFLICT (user_id) DO NOTHING;
    
    RAISE NOTICE 'Admin user created/verified for email: %', admin_email;
  ELSE
    RAISE NOTICE 'User not found for email: %', admin_email;
  END IF;
END;
$$;