import { useCallback } from 'react';
import { useToast } from './useToast';
import { AppError, ErrorType, ErrorHandlerOptions } from '../types/errors';
import { ERROR_MESSAGES, ERROR_TYPES, RETRY_CONFIG } from '../config/constants';
import { supabase } from '../lib/supabase';

/**
 * Hook centralizado para manejo de errores
 * Proporciona funciones para clasificar, manejar y notificar errores
 */
export function useErrorHandler() {
  const { error: showErrorToast, warning, info } = useToast();

  /**
   * Clasificar error según su tipo y mensaje
   */
  const classifyError = useCallback((error: Error | any): ErrorType => {
    const message = error?.message?.toLowerCase() || '';
    const code = error?.code || '';

    // Errores de autenticación
    if (message.includes('session_not_found') ||
        message.includes('jwt expired') ||
        message.includes('invalid_credentials') ||
        message.includes('refresh_token_not_found') ||
        message.includes('auth timeout') ||
        code === 'invalid_credentials') {
      return ERROR_TYPES.AUTH;
    }

    // Errores de permisos
    if (message.includes('403') ||
        message.includes('permission') ||
        message.includes('unauthorized') ||
        message.includes('insufficient')) {
      return ERROR_TYPES.PERMISSION;
    }

    // Errores de red
    if (message.includes('failed to fetch') ||
        message.includes('network') ||
        message.includes('connection') ||
        message.includes('timeout') ||
        error instanceof TypeError) {
      return ERROR_TYPES.NETWORK;
    }

    // Errores de IA
    if (message.includes('api key') ||
        message.includes('gemini') ||
        message.includes('quota') ||
        message.includes('rate limit')) {
      return ERROR_TYPES.AI;
    }

    // Errores de base de datos
    if (message.includes('pgrst') ||
        message.includes('database') ||
        message.includes('relation') ||
        code?.startsWith('23')) {
      return ERROR_TYPES.DATABASE;
    }

    return ERROR_TYPES.UNKNOWN;
  }, []);

  /**
   * Obtener mensaje de error amigable para el usuario
   */
  const getErrorMessage = useCallback((error: Error | any, type: ErrorType): string => {
    const message = error?.message || '';

    switch (type) {
      case ERROR_TYPES.AUTH:
        if (message.includes('invalid_credentials')) {
          return 'Credenciales incorrectas. Verifica tu email y contraseña.';
        }
        if (message.includes('over_email_send_rate_limit')) {
          const match = message.match(/after (\d+) seconds/);
          const waitTime = match ? match[1] : '60';
          return `Demasiados intentos. Espera ${waitTime} segundos.`;
        }
        return ERROR_MESSAGES.AUTH_EXPIRED;

      case ERROR_TYPES.NETWORK:
        if (message.includes('timeout')) {
          return ERROR_MESSAGES.TIMEOUT;
        }
        return ERROR_MESSAGES.NETWORK;

      case ERROR_TYPES.PERMISSION:
        return ERROR_MESSAGES.PERMISSION_DENIED;

      case ERROR_TYPES.AI:
        if (message.includes('api key')) {
          return ERROR_MESSAGES.AI_INVALID_KEY;
        }
        if (message.includes('quota') || message.includes('429')) {
          return ERROR_MESSAGES.AI_QUOTA_EXCEEDED;
        }
        return 'Error en el servicio de IA. Intenta más tarde.';

      case ERROR_TYPES.DATABASE:
        if (message.includes('duplicate') || message.includes('23505')) {
          return 'Este elemento ya existe.';
        }
        if (message.includes('foreign key') || message.includes('23503')) {
          return 'No se puede eliminar: hay elementos relacionados.';
        }
        return 'Error en la base de datos. Intenta nuevamente.';

      default:
        return ERROR_MESSAGES.GENERIC;
    }
  }, []);

  /**
   * Crear objeto AppError estructurado
   */
  const createAppError = useCallback((
    error: Error | any,
    operation?: string,
    context?: Record<string, any>
  ): AppError => {
    const type = classifyError(error);
    const message = getErrorMessage(error, type);

    return {
      type,
      message,
      originalError: error instanceof Error ? error : new Error(String(error)),
      code: error?.code,
      context,
      timestamp: new Date(),
      operation,
    };
  }, [classifyError, getErrorMessage]);

  /**
   * Función principal para manejar errores
   */
  const handleError = useCallback(async (
    error: Error | any,
    options: ErrorHandlerOptions = {}
  ): Promise<any> => {
    const {
      showToast = true,
      logError = true,
      retryable = false,
      retryConfig = RETRY_CONFIG,
      fallbackValue = null,
      context = {},
    } = options;

    const appError = createAppError(error, context.operation, context);

    // Log estructurado del error
    if (logError) {
      console.group(`❌ Error Handler: ${appError.type.toUpperCase()}`);
      console.error('Message:', appError.message);
      console.error('Original:', appError.originalError);
      console.error('Context:', appError.context);
      console.error('Operation:', appError.operation);
      console.error('Timestamp:', appError.timestamp.toISOString());
      console.groupEnd();
    }

    // Manejar errores de autenticación automáticamente
    if (appError.type === ERROR_TYPES.AUTH) {
      console.log('🔓 Auth error detected, signing out...');
      try {
        await supabase.auth.signOut();
      } catch (signOutError) {
        console.error('Error during sign out:', signOutError);
      }
    }

    // Mostrar toast si está habilitado
    if (showToast) {
      if (appError.type === ERROR_TYPES.AUTH) {
        warning('Sesión expirada', 'Inicia sesión nuevamente');
      } else if (appError.type === ERROR_TYPES.NETWORK && retryable) {
        warning('Error de conexión', 'Reintentando automáticamente...');
      } else {
        showErrorToast(appError.message);
      }
    }

    // Retornar valor de fallback si se proporciona
    return fallbackValue;
  }, [createAppError, showErrorToast, warning]);

  /**
   * Función con retry automático
   */
  const withRetry = useCallback(async <T>(
    operation: () => Promise<T>,
    options: ErrorHandlerOptions & { operationName?: string } = {}
  ): Promise<T | null> => {
    const {
      retryConfig = {},
      operationName = 'operation',
      context = {},
    } = options;

    const finalRetryConfig = {
      maxRetries: retryConfig.maxRetries ?? RETRY_CONFIG.MAX_RETRIES,
      initialDelay: retryConfig.initialDelay ?? RETRY_CONFIG.INITIAL_DELAY,
      maxDelay: retryConfig.maxDelay ?? RETRY_CONFIG.MAX_DELAY,
      backoffFactor: retryConfig.backoffFactor ?? RETRY_CONFIG.BACKOFF_FACTOR,
    };

    let lastError: Error;
    let delay = finalRetryConfig.initialDelay;

    for (let attempt = 0; attempt <= finalRetryConfig.maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          console.log(`🔄 Retry attempt ${attempt}/${finalRetryConfig.maxRetries} for ${operationName}`);
          await new Promise(resolve => setTimeout(resolve, delay));
          delay = Math.min(delay * finalRetryConfig.backoffFactor, finalRetryConfig.maxDelay);
        }

        const result = await operation();
        
        if (attempt > 0) {
          info('Operación completada', `${operationName} exitosa después de ${attempt} reintentos`);
        }
        
        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        const errorType = classifyError(lastError);
        
        // No reintentar errores de autenticación o validación
        if (errorType === ERROR_TYPES.AUTH || 
            errorType === ERROR_TYPES.PERMISSION || 
            errorType === ERROR_TYPES.VALIDATION) {
          break;
        }

        // Si es el último intento, manejar el error
        if (attempt === finalRetryConfig.maxRetries) {
          break;
        }
      }
    }

    // Manejar el error final
    return await handleError(lastError!, {
      ...options,
      context: { ...context, operation: operationName, attempts: finalRetryConfig.maxRetries + 1 },
    });
  }, [handleError, classifyError, info]);

  /**
   * Wrapper para operaciones de base de datos
   */
  const withDatabaseErrorHandling = useCallback(async <T>(
    operation: () => Promise<T>,
    operationName: string,
    fallbackValue: T | null = null
  ): Promise<T | null> => {
    return withRetry(operation, {
      operationName,
      fallbackValue,
      retryable: true,
      context: { type: 'database' },
    });
  }, [withRetry]);

  /**
   * Wrapper para operaciones de IA
   */
  const withAIErrorHandling = useCallback(async <T>(
    operation: () => Promise<T>,
    operationName: string
  ): Promise<T | null> => {
    return withRetry(operation, {
      operationName,
      retryable: false, // IA errors usually aren't retryable
      context: { type: 'ai' },
      retryConfig: { maxRetries: 1, initialDelay: 2000, maxDelay: 5000, backoffFactor: 2 },
    });
  }, [withRetry]);

  /**
   * Wrapper para operaciones de autenticación
   */
  const withAuthErrorHandling = useCallback(async <T>(
    operation: () => Promise<T>,
    operationName: string
  ): Promise<T | null> => {
    return withRetry(operation, {
      operationName,
      retryable: false, // Auth errors usually aren't retryable
      context: { type: 'auth' },
      retryConfig: { maxRetries: 0, initialDelay: 0, maxDelay: 0, backoffFactor: 1 },
    });
  }, [withRetry]);

  return {
    handleError,
    withRetry,
    withDatabaseErrorHandling,
    withAIErrorHandling,
    withAuthErrorHandling,
    classifyError,
    createAppError,
  };
}