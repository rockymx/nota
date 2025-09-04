import { z } from 'zod';
import DOMPurify from 'dompurify';

/**
 * Sistema centralizado de validación y sanitización
 * Utiliza Zod para schemas y DOMPurify para sanitización
 */

// Configuración de DOMPurify
const purifyConfig = {
  ALLOWED_TAGS: [
    'p', 'br', 'strong', 'em', 'u', 's', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'ul', 'ol', 'li', 'blockquote', 'code', 'pre', 'a', 'img'
  ],
  ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'target', 'rel'],
  ALLOW_DATA_ATTR: false,
  FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form', 'input'],
  FORBID_ATTR: ['onclick', 'onload', 'onerror', 'onmouseover'],
};

// Límites de longitud configurables
export const VALIDATION_LIMITS = {
  NOTE_TITLE_MIN: 1,
  NOTE_TITLE_MAX: 200,
  NOTE_CONTENT_MAX: 50000,
  FOLDER_NAME_MIN: 1,
  FOLDER_NAME_MAX: 50,
  PROMPT_NAME_MIN: 3,
  PROMPT_NAME_MAX: 100,
  PROMPT_DESCRIPTION_MIN: 10,
  PROMPT_DESCRIPTION_MAX: 500,
  PROMPT_TEMPLATE_MIN: 10,
  PROMPT_TEMPLATE_MAX: 5000,
  EMAIL_MAX: 254,
  PASSWORD_MIN: 6,
  PASSWORD_MAX: 128,
  TAG_MIN: 1,
  TAG_MAX: 30,
  TAGS_MAX_COUNT: 20,
} as const;

// Regex patterns
const PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  HEX_COLOR: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
  SAFE_TEXT: /^[a-zA-ZáéíóúñÁÉÍÓÚÑ0-9\s\-_.,!?()]+$/,
  HASHTAG: /^[a-zA-ZáéíóúñÁÉÍÓÚÑ0-9_-]+$/,
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  PROMPT_VARIABLE: /\{[a-zA-Z_][a-zA-Z0-9_]*\}/g,
} as const;

// Schemas de validación con Zod
export const schemas: Record<string, z.ZodSchema<any>> = {
  // Validación de email
  email: z.string()
    .min(1, 'El email es requerido')
    .max(VALIDATION_LIMITS.EMAIL_MAX, `El email no puede exceder ${VALIDATION_LIMITS.EMAIL_MAX} caracteres`)
    .email('Formato de email inválido')
    .refine(email => PATTERNS.EMAIL.test(email), 'Email no válido'),

  // Validación de contraseña
  password: z.string()
    .min(VALIDATION_LIMITS.PASSWORD_MIN, `La contraseña debe tener al menos ${VALIDATION_LIMITS.PASSWORD_MIN} caracteres`)
    .max(VALIDATION_LIMITS.PASSWORD_MAX, `La contraseña no puede exceder ${VALIDATION_LIMITS.PASSWORD_MAX} caracteres`)
    .refine(password => !/\s/.test(password), 'La contraseña no puede contener espacios')
    .refine(password => /[a-zA-Z]/.test(password), 'La contraseña debe contener al menos una letra'),

  // Validación de título de nota
  noteTitle: z.string()
    .min(VALIDATION_LIMITS.NOTE_TITLE_MIN, 'El título es requerido')
    .max(VALIDATION_LIMITS.NOTE_TITLE_MAX, `El título no puede exceder ${VALIDATION_LIMITS.NOTE_TITLE_MAX} caracteres`)
    .refine(title => title.trim().length > 0, 'El título no puede estar vacío')
    .transform(title => title.trim()),

  // Validación de contenido de nota
  noteContent: z.string()
    .max(VALIDATION_LIMITS.NOTE_CONTENT_MAX, `El contenido no puede exceder ${VALIDATION_LIMITS.NOTE_CONTENT_MAX} caracteres`)
    .transform(content => sanitizeContent(content)),

  // Validación de nombre de carpeta
  folderName: z.string()
    .min(VALIDATION_LIMITS.FOLDER_NAME_MIN, 'El nombre de carpeta es requerido')
    .max(VALIDATION_LIMITS.FOLDER_NAME_MAX, `El nombre no puede exceder ${VALIDATION_LIMITS.FOLDER_NAME_MAX} caracteres`)
    .refine(name => PATTERNS.SAFE_TEXT.test(name), 'El nombre contiene caracteres no permitidos')
    .transform(name => name.trim()),

  // Validación de color hexadecimal
  hexColor: z.string()
    .refine(color => PATTERNS.HEX_COLOR.test(color), 'Color hexadecimal inválido'),

  // Validación de UUID
  uuid: z.string()
    .refine(id => PATTERNS.UUID.test(id), 'ID inválido'),

  // Validación de tags
  tag: z.string()
    .min(VALIDATION_LIMITS.TAG_MIN, 'Tag muy corto')
    .max(VALIDATION_LIMITS.TAG_MAX, `Tag no puede exceder ${VALIDATION_LIMITS.TAG_MAX} caracteres`)
    .refine(tag => PATTERNS.HASHTAG.test(tag), 'Tag contiene caracteres no permitidos')
    .transform(tag => tag.toLowerCase().trim()),

  tags: z.array(z.string())
    .max(VALIDATION_LIMITS.TAGS_MAX_COUNT, `Máximo ${VALIDATION_LIMITS.TAGS_MAX_COUNT} tags permitidos`)
    .transform((tags: string[]) => tags.map((tag: string) => schemas.tag.parse(tag))),

  // Validación de prompt de IA
  promptName: z.string()
    .min(VALIDATION_LIMITS.PROMPT_NAME_MIN, `El nombre debe tener al menos ${VALIDATION_LIMITS.PROMPT_NAME_MIN} caracteres`)
    .max(VALIDATION_LIMITS.PROMPT_NAME_MAX, `El nombre no puede exceder ${VALIDATION_LIMITS.PROMPT_NAME_MAX} caracteres`)
    .transform(name => name.trim()),

  promptDescription: z.string()
    .min(VALIDATION_LIMITS.PROMPT_DESCRIPTION_MIN, `La descripción debe tener al menos ${VALIDATION_LIMITS.PROMPT_DESCRIPTION_MIN} caracteres`)
    .max(VALIDATION_LIMITS.PROMPT_DESCRIPTION_MAX, `La descripción no puede exceder ${VALIDATION_LIMITS.PROMPT_DESCRIPTION_MAX} caracteres`)
    .transform(desc => desc.trim()),

  promptTemplate: z.string()
    .min(VALIDATION_LIMITS.PROMPT_TEMPLATE_MIN, `El template debe tener al menos ${VALIDATION_LIMITS.PROMPT_TEMPLATE_MIN} caracteres`)
    .max(VALIDATION_LIMITS.PROMPT_TEMPLATE_MAX, `El template no puede exceder ${VALIDATION_LIMITS.PROMPT_TEMPLATE_MAX} caracteres`)
    .refine(template => template.includes('{content}'), 'El template debe incluir la variable {content}')
    .refine(template => validatePromptVariables(template), 'Variables de prompt inválidas')
    .transform(template => template.trim()),

  promptCategory: z.enum(['escritura', 'resumen', 'edicion', 'expansion', 'formato', 'custom'])
    .default('custom'),
};

// Schemas compuestos para entidades completas
export const entitySchemas = {
  // Schema para crear/actualizar nota
  note: z.object({
    title: schemas.noteTitle,
    content: schemas.noteContent,
    folderId: z.string().uuid().nullable().optional(),
    tags: schemas.tags.optional().default([]),
  }),

  // Schema para crear/actualizar carpeta
  folder: z.object({
    name: schemas.folderName,
    color: schemas.hexColor,
  }),

  // Schema para autenticación
  auth: z.object({
    email: schemas.email,
    password: schemas.password,
  }),

  // Schema para prompt de IA
  aiPrompt: z.object({
    name: schemas.promptName,
    description: schemas.promptDescription,
    promptTemplate: schemas.promptTemplate,
    category: schemas.promptCategory,
  }),

  // Schema para configuración de usuario
  userSettings: z.object({
    theme: z.enum(['light', 'dark']).default('light'),
    autoSave: z.boolean().default(true),
    geminiApiKey: z.string().optional(),
  }),
};

/**
 * Función para sanitizar contenido HTML/Markdown
 */
export function sanitizeContent(content: string): string {
  if (!content) return '';
  
  // Sanitizar HTML manteniendo Markdown básico
  const sanitized = DOMPurify.sanitize(content, purifyConfig);
  
  // Limpiar espacios excesivos
  return sanitized
    .replace(/\n{3,}/g, '\n\n') // Máximo 2 saltos de línea consecutivos
    .replace(/[ \t]{2,}/g, ' ') // Múltiples espacios a uno solo
    .trim();
}

/**
 * Validar variables en templates de prompts
 */
function validatePromptVariables(template: string): boolean {
  const variables = template.match(PATTERNS.PROMPT_VARIABLE) || [];
  const allowedVariables = ['{content}', '{title}', '{tags}'];
  
  return variables.every(variable => allowedVariables.includes(variable));
}

/**
 * Función para extraer y validar hashtags del contenido
 */
export function extractAndValidateHashtags(content: string): string[] {
  if (!content) return [];
  
  const hashtagRegex = /#([a-zA-ZáéíóúñÁÉÍÓÚÑ0-9_-]+)/g;
  const matches = content.match(hashtagRegex) || [];
  
  const hashtags = matches
    .map(tag => tag.slice(1).toLowerCase())
    .filter(tag => {
      try {
        schemas.tag.parse(tag);
        return true;
      } catch {
        return false;
      }
    })
    .slice(0, VALIDATION_LIMITS.TAGS_MAX_COUNT); // Limitar cantidad
  
  return [...new Set(hashtags)]; // Remover duplicados
}

/**
 * Validador de archivos (para futuras funciones de importación)
 */
export const fileValidation = {
  maxSize: 10 * 1024 * 1024, // 10MB
  allowedTypes: ['text/plain', 'text/markdown', 'application/json'],
  
  validateFile: (file: File) => {
    if (file.size > fileValidation.maxSize) {
      throw new Error(`El archivo no puede exceder ${fileValidation.maxSize / 1024 / 1024}MB`);
    }
    
    if (!fileValidation.allowedTypes.includes(file.type)) {
      throw new Error('Tipo de archivo no permitido');
    }
    
    return true;
  },
};

/**
 * Funciones de validación rápida para uso directo
 */
export const validators = {
  isValidEmail: (email: string): boolean => {
    try {
      schemas.email.parse(email);
      return true;
    } catch {
      return false;
    }
  },

  isValidUUID: (id: string): boolean => {
    try {
      schemas.uuid.parse(id);
      return true;
    } catch {
      return false;
    }
  },

  isValidHexColor: (color: string): boolean => {
    try {
      schemas.hexColor.parse(color);
      return true;
    } catch {
      return false;
    }
  },

  isValidPromptTemplate: (template: string): boolean => {
    try {
      schemas.promptTemplate.parse(template);
      return true;
    } catch {
      return false;
    }
  },
};

/**
 * Hook para validación en tiempo real
 */
export function useValidation<T>(schema: z.ZodSchema<T>) {
  const validate = (data: unknown): { success: boolean; data?: T; errors?: string[] } => {
    try {
      const validatedData = schema.parse(data);
      return { success: true, data: validatedData };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.issues.map((err: any) => err.message);
        return { success: false, errors };
      }
      return { success: false, errors: ['Error de validación desconocido'] };
    }
  };

  const validateAsync = async (data: unknown): Promise<{ success: boolean; data?: T; errors?: string[] }> => {
    try {
      const validatedData = await schema.parseAsync(data);
      return { success: true, data: validatedData };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.issues.map((err: any) => err.message);
        return { success: false, errors };
      }
      return { success: false, errors: ['Error de validación desconocido'] };
    }
  };

  return { validate, validateAsync };
}

/**
 * Interceptor de validación para operaciones de Supabase
 */
export class ValidationInterceptor {
  static validateBeforeInsert(table: string, data: any): any {
    switch (table) {
      case 'notes':
        return entitySchemas.note.parse(data);
      case 'folders':
        return entitySchemas.folder.parse(data);
      case 'ai_prompts':
        return entitySchemas.aiPrompt.parse(data);
      default:
        return data;
    }
  }

  static validateBeforeUpdate(table: string, data: any): any {
    switch (table) {
      case 'notes':
        return entitySchemas.note.partial().parse(data);
      case 'folders':
        return entitySchemas.folder.partial().parse(data);
      case 'ai_prompts':
        return entitySchemas.aiPrompt.partial().parse(data);
      default:
        return data;
    }
  }
}

/**
 * Funciones de sanitización específicas
 */
export const sanitizers = {
  // Sanitizar contenido de nota (permite Markdown básico)
  noteContent: (content: string): string => {
    if (!content) return '';
    
    // Primero sanitizar HTML
    const sanitized = DOMPurify.sanitize(content, purifyConfig);
    
    // Limpiar formato
    return sanitized
      .replace(/\n{3,}/g, '\n\n')
      .replace(/[ \t]{2,}/g, ' ')
      .trim();
  },

  // Sanitizar texto plano (títulos, nombres)
  plainText: (text: string): string => {
    if (!text) return '';
    
    return DOMPurify.sanitize(text, { 
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: [],
    }).trim();
  },

  // Sanitizar template de prompt
  promptTemplate: (template: string): string => {
    if (!template) return '';
    
    // Permitir solo variables específicas
    const sanitized = DOMPurify.sanitize(template, {
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: [],
    });
    
    // Validar que las variables sean correctas
    const variables = sanitized.match(PATTERNS.PROMPT_VARIABLE) || [];
    const allowedVariables = ['{content}', '{title}', '{tags}'];
    
    variables.forEach(variable => {
      if (!allowedVariables.includes(variable)) {
        throw new Error(`Variable no permitida: ${variable}`);
      }
    });
    
    return sanitized.trim();
  },
};

/**
 * Validadores específicos para casos de uso complejos
 */
export const customValidators = {
  // Validar que un prompt tenga la estructura correcta
  validatePromptStructure: (template: string): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    if (!template.includes('{content}')) {
      errors.push('El template debe incluir la variable {content}');
    }
    
    const variables = template.match(PATTERNS.PROMPT_VARIABLE) || [];
    const invalidVariables = variables.filter(v => !['content', 'title', 'tags'].includes(v.slice(1, -1)));
    
    if (invalidVariables.length > 0) {
      errors.push(`Variables no válidas: ${invalidVariables.join(', ')}`);
    }
    
    if (template.length < VALIDATION_LIMITS.PROMPT_TEMPLATE_MIN) {
      errors.push(`El template debe tener al menos ${VALIDATION_LIMITS.PROMPT_TEMPLATE_MIN} caracteres`);
    }
    
    return { valid: errors.length === 0, errors };
  },

  // Validar contenido de nota para IA
  validateNoteForAI: (content: string): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    if (!content || content.trim().length === 0) {
      errors.push('El contenido no puede estar vacío para usar IA');
    }
    
    if (content.length < 10) {
      errors.push('El contenido es muy corto para procesar con IA');
    }
    
    if (content.length > 10000) {
      errors.push('El contenido es muy largo para procesar con IA (máximo 10,000 caracteres)');
    }
    
    return { valid: errors.length === 0, errors };
  },

  // Validar datos de importación
  validateImportData: (data: any): { valid: boolean; errors: string[]; validNotes: any[] } => {
    const errors: string[] = [];
    const validNotes: any[] = [];
    
    if (!Array.isArray(data)) {
      errors.push('Los datos deben ser un array de notas');
      return { valid: false, errors, validNotes };
    }
    
    data.forEach((item, index) => {
      try {
        const validNote = entitySchemas.note.parse(item);
        validNotes.push(validNote);
      } catch (error) {
        if (error instanceof z.ZodError) {
          errors.push(`Nota ${index + 1}: ${error.issues[0].message}`);
        }
      }
    });
    
    return { 
      valid: errors.length === 0, 
      errors, 
      validNotes 
    };
  },
};

/**
 * Middleware de validación para hooks
 */
export function withValidation<T extends any[], R>(
  schema: z.ZodSchema<any>,
  fn: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R> => {
    // Validar argumentos si es necesario
    const validatedArgs = args; // Implementar validación específica si es necesario
    return fn(...validatedArgs);
  };
}

/**
 * Función auxiliar para validar y sanitizar datos antes de enviar a Supabase
 */
export function validateAndSanitize<T>(schema: z.ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0];
      throw new Error(`Validación fallida: ${firstError.message}`);
    }
    throw new Error('Error de validación desconocido');
  }
}