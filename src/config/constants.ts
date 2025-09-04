/**
 * Configuración centralizada de la aplicación
 */

// Timeouts para operaciones de red (en milisegundos)
export const TIMEOUTS = {
  AUTH: 15000,           // 15s para autenticación
  DATABASE: 10000,       // 10s para operaciones de base de datos
  AI_API: 30000,         // 30s para llamadas a IA (pueden ser lentas)
  QUICK_OPERATION: 5000, // 5s para operaciones rápidas
} as const;

// Configuración de reintentos
export const RETRY_CONFIG = {
  MAX_RETRIES: 3,
  INITIAL_DELAY: 1000,   // 1s
  MAX_DELAY: 30000,      // 30s
  BACKOFF_FACTOR: 2,     // Exponencial
} as const;

// Configuración de cache
export const CACHE_CONFIG = {
  STALE_TIME: 5 * 60 * 1000,    // 5 minutos
  GC_TIME: 10 * 60 * 1000,      // 10 minutos
  FOLDERS_STALE_TIME: 10 * 60 * 1000,  // 10 minutos (carpetas cambian menos)
  PROMPTS_STALE_TIME: 15 * 60 * 1000,  // 15 minutos (prompts cambian poco)
} as const;

// Configuración de toasts
export const TOAST_CONFIG = {
  SUCCESS_DURATION: 4000,
  ERROR_DURATION: 6000,
  WARNING_DURATION: 5000,
  INFO_DURATION: 4000,
  UNDO_DURATION: 5000,
} as const;

// Mensajes de error estandarizados
export const ERROR_MESSAGES = {
  NETWORK: 'Error de conexión. Verifica tu internet.',
  TIMEOUT: 'La operación tardó demasiado. Intenta nuevamente.',
  AUTH_EXPIRED: 'Tu sesión ha expirado. Inicia sesión nuevamente.',
  AUTH_INVALID: 'Credenciales inválidas.',
  PERMISSION_DENIED: 'No tienes permisos para esta acción.',
  NOT_FOUND: 'El recurso solicitado no existe.',
  RATE_LIMIT: 'Demasiadas solicitudes. Espera un momento.',
  GENERIC: 'Ha ocurrido un error inesperado.',
  AI_NOT_CONFIGURED: 'Configura tu API key de Gemini primero.',
  AI_QUOTA_EXCEEDED: 'Cuota de IA excedida. Intenta más tarde.',
  AI_INVALID_KEY: 'API key de Gemini inválida.',
} as const;

// Tipos de errores para clasificación
export const ERROR_TYPES = {
  NETWORK: 'network',
  AUTH: 'auth',
  PERMISSION: 'permission',
  VALIDATION: 'validation',
  AI: 'ai',
  DATABASE: 'database',
  UNKNOWN: 'unknown',
} as const;