/**
 * Tipos TypeScript para el sistema de manejo de errores
 */

export type ErrorType = 'network' | 'auth' | 'permission' | 'validation' | 'ai' | 'database' | 'unknown';

export interface AppError {
  type: ErrorType;
  message: string;
  originalError?: Error;
  code?: string;
  context?: Record<string, any>;
  timestamp: Date;
  userId?: string;
  operation?: string;
}

export interface RetryConfig {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  backoffFactor: number;
}

export interface ErrorHandlerOptions {
  showToast?: boolean;
  logError?: boolean;
  retryable?: boolean;
  retryConfig?: Partial<RetryConfig>;
  fallbackValue?: any;
  context?: Record<string, any>;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error?: AppError;
  errorId?: string;
}