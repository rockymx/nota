/*
  # Sistema de Administrador

  1. Nuevas Tablas
    - `admin_users`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `is_active` (boolean, default true)
      - `created_by` (uuid, foreign key to auth.users)
      - `created_at` (timestamp)

  2. Vistas
    - `admin_user_stats` - Estadísticas completas de usuarios para el dashboard

  3. Funciones
    - `setup_admin_by_email()` - Configurar administradores automáticamente por email

  4. Seguridad
    - Enable RLS en todas las tablas
    - Políticas para que solo administradores accedan a datos de admin
*/

-- Crear tabla de administradores
CREATE TABLE IF NOT EXISTS admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Crear políticas RLS para admin_users
DO $$
BEGIN
  -- Eliminar políticas existentes si existen
  DROP POLICY IF EXISTS "Only admins can read admin_users" ON admin_users;
  DROP POLICY IF EXISTS "Only admins can insert admin_users" ON admin_users;
  DROP POLICY IF EXISTS "Only admins can update admin_users" ON admin_users;
  DROP POLICY IF EXISTS "Only admins can delete admin_users" ON admin_users;

  -- Crear nuevas políticas
  CREATE POLICY "Only admins can read admin_users"
    ON admin_users
    FOR SELECT
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM admin_users au 
        WHERE au.user_id = auth.uid() AND au.is_active = true
      )
    );

  CREATE POLICY "Only admins can insert admin_users"
    ON admin_users
    FOR INSERT
    TO authenticated
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM admin_users au 
        WHERE au.user_id = auth.uid() AND au.is_active = true
      )
    );

  CREATE POLICY "Only admins can update admin_users"
    ON admin_users
    FOR UPDATE
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM admin_users au 
        WHERE au.user_id = auth.uid() AND au.is_active = true
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM admin_users au 
        WHERE au.user_id = auth.uid() AND au.is_active = true
      )
    );

  CREATE POLICY "Only admins can delete admin_users"
    ON admin_users
    FOR DELETE
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM admin_users au 
        WHERE au.user_id = auth.uid() AND au.is_active = true
      )
    );
END $$;

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

-- Función para configurar administradores automáticamente
CREATE OR REPLACE FUNCTION setup_admin_by_email()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  admin_emails text[] := ARRAY['2dcommx02@gmail.com', '2dcommx01@gmail.com'];
  admin_email text;
  user_record record;
BEGIN
  -- Iterar sobre cada email de administrador
  FOREACH admin_email IN ARRAY admin_emails
  LOOP
    -- Buscar usuario por email
    SELECT id INTO user_record
    FROM users 
    WHERE email = admin_email;
    
    -- Si el usuario existe, agregarlo como admin
    IF FOUND THEN
      INSERT INTO admin_users (user_id, created_by, is_active)
      VALUES (user_record.id, user_record.id, true)
      ON CONFLICT (user_id) 
      DO UPDATE SET 
        is_active = true,
        created_at = COALESCE(admin_users.created_at, now());
        
      RAISE NOTICE 'Admin setup completed for: %', admin_email;
    ELSE
      RAISE NOTICE 'User not found for email: %', admin_email;
    END IF;
  END LOOP;
END;
$$;

-- Crear índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_admin_users_user_id ON admin_users(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_users_active ON admin_users(is_active) WHERE is_active = true;

-- Ejecutar la función para configurar admins existentes
SELECT setup_admin_by_email();