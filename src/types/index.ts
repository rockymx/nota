/**
 * Tipos TypeScript para la aplicación de notas
 */

/**
 * Interfaz para una nota individual
 */
export interface Note {
  id: string;                    // ID único de la nota
  title: string;                 // Título de la nota
  content: string;               // Contenido en texto plano
  folderId: string | null;       // ID de la carpeta (null si no está en carpeta)
  createdAt: Date;              // Fecha de creación
  updatedAt: Date;              // Fecha de última actualización
  tags: string[];               // Etiquetas para categorización
}

/**
 * Interfaz para una carpeta de organización
 */
export interface Folder {
  id: string;                    // ID único de la carpeta
  name: string;                  // Nombre de la carpeta
  color: string;                 // Color en formato hexadecimal
  createdAt: Date;              // Fecha de creación
}

/**
 * Configuración para funciones de IA (Google Gemini)
 */
export interface AIConfig {
  apiKey: string;                // API key de Google Gemini
  enabled: boolean;              // Si las funciones de IA están habilitadas
}

/**
 * Interfaz para un prompt de IA personalizado
 */
export interface AIPrompt {
  id: string;                    // ID único del prompt
  name: string;                  // Nombre descriptivo del prompt
  description: string;           // Descripción de lo que hace el prompt
  promptTemplate: string;        // Plantilla del prompt con variables
  category: string;              // Categoría del prompt
  isDefault: boolean;            // Si es un prompt del sistema
  userId: string | null;         // ID del usuario (null para prompts por defecto)
  createdAt: Date;              // Fecha de creación
  updatedAt: Date;              // Fecha de última actualización
}