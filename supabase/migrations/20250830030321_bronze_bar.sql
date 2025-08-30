/*
  # Create AI prompts table

  1. New Tables
    - `ai_prompts`
      - `id` (uuid, primary key)
      - `name` (text, prompt name)
      - `description` (text, prompt description)
      - `prompt_template` (text, the actual prompt)
      - `category` (text, prompt category)
      - `is_default` (boolean, if it's a system default)
      - `user_id` (uuid, foreign key to auth.users)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `ai_prompts` table
    - Add policies for authenticated users to manage their own prompts
    - Add policy for users to read default prompts

  3. Default Data
    - Insert 5 default prompts for all users
*/

CREATE TABLE IF NOT EXISTS ai_prompts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  prompt_template text NOT NULL,
  category text DEFAULT 'general',
  is_default boolean DEFAULT false,
  user_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE ai_prompts ENABLE ROW LEVEL SECURITY;

-- Policies for user prompts
CREATE POLICY "Users can create own prompts"
  ON ai_prompts
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id AND is_default = false);

CREATE POLICY "Users can read own prompts"
  ON ai_prompts
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR is_default = true);

CREATE POLICY "Users can update own prompts"
  ON ai_prompts
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id AND is_default = false)
  WITH CHECK (auth.uid() = user_id AND is_default = false);

CREATE POLICY "Users can delete own prompts"
  ON ai_prompts
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id AND is_default = false);

-- Insert default prompts (available to all users)
INSERT INTO ai_prompts (name, description, prompt_template, category, is_default, user_id) VALUES
(
  'Mejorar escritura',
  'Mejora la gramática, claridad y estructura del texto',
  'Mejora y organiza el siguiente texto manteniendo el contenido original pero haciéndolo más claro, estructurado y fácil de leer. Corrige errores gramaticales y mejora la redacción. Mantén el idioma original:\n\n{content}',
  'escritura',
  true,
  null
),
(
  'Crear resumen',
  'Genera un resumen conciso del contenido',
  'Crea un resumen conciso del siguiente texto en máximo 3-4 oraciones. Mantén los puntos más importantes y el idioma original:\n\n{content}',
  'resumen',
  true,
  null
),
(
  'Hacer más conciso',
  'Reduce el texto manteniendo la información esencial',
  'Haz este texto más conciso y directo, eliminando redundancias pero manteniendo toda la información importante. Mantén el idioma original:\n\n{content}',
  'edicion',
  true,
  null
),
(
  'Expandir contenido',
  'Agrega más detalles y explicaciones al texto',
  'Expande este texto agregando más detalles, ejemplos y explicaciones relevantes. Mantén el tono y el idioma original:\n\n{content}',
  'expansion',
  true,
  null
),
(
  'Convertir en lista',
  'Organiza el contenido en formato de lista estructurada',
  'Convierte el siguiente texto en una lista bien estructurada y organizada. Usa viñetas, numeración o subtítulos según sea apropiado. Mantén el idioma original:\n\n{content}',
  'formato',
  true,
  null
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_ai_prompts_user_id ON ai_prompts(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_prompts_category ON ai_prompts(category);