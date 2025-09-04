import React, { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { ErrorBoundaryState, AppError } from '../types/errors';
import { ERROR_TYPES } from '../config/constants';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: AppError, retry: () => void) => ReactNode;
  onError?: (error: AppError) => void;
}

/**
 * Error Boundary para capturar errores críticos de React
 * Proporciona UI de recuperación y logging estructurado
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private retryCount = 0;
  private maxRetries = 3;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    const appError: AppError = {
      type: ERROR_TYPES.UNKNOWN,
      message: error.message || 'Error crítico de la aplicación',
      originalError: error,
      timestamp: new Date(),
      operation: 'react_render',
    };

    return {
      hasError: true,
      error: appError,
      errorId: `error-${Date.now()}`,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const appError: AppError = {
      type: this.classifyReactError(error),
      message: this.getErrorMessage(error),
      originalError: error,
      timestamp: new Date(),
      operation: 'react_render',
      context: {
        componentStack: errorInfo.componentStack,
        errorBoundary: 'ErrorBoundary',
        retryCount: this.retryCount,
      },
    };

    // Log estructurado del error
    console.group('🚨 Error Boundary Triggered');
    console.error('Error:', error);
    console.error('Error Info:', errorInfo);
    console.error('App Error:', appError);
    console.error('Component Stack:', errorInfo.componentStack);
    console.groupEnd();

    // Llamar callback de error si existe
    if (this.props.onError) {
      this.props.onError(appError);
    }

    // Reportar error a servicio de monitoreo (si está configurado)
    this.reportError(appError);
  }

  private classifyReactError(error: Error): ErrorType {
    const message = error.message.toLowerCase();

    if (message.includes('network') || message.includes('fetch')) {
      return ERROR_TYPES.NETWORK;
    }

    if (message.includes('auth') || message.includes('session')) {
      return ERROR_TYPES.AUTH;
    }

    if (message.includes('permission') || message.includes('403')) {
      return ERROR_TYPES.PERMISSION;
    }

    return ERROR_TYPES.UNKNOWN;
  }

  private getErrorMessage(error: Error): string {
    const message = error.message.toLowerCase();

    if (message.includes('chunk')) {
      return 'Error cargando la aplicación. Intenta recargar la página.';
    }

    if (message.includes('network')) {
      return 'Error de conexión. Verifica tu internet.';
    }

    if (message.includes('auth')) {
      return 'Error de autenticación. Inicia sesión nuevamente.';
    }

    return 'Ha ocurrido un error inesperado en la aplicación.';
  }

  private reportError(error: AppError) {
    // Aquí se puede integrar con servicios como Sentry, LogRocket, etc.
    console.log('📊 Error reported to monitoring service:', error);
  }

  private handleRetry = () => {
    if (this.retryCount < this.maxRetries) {
      this.retryCount++;
      console.log(`🔄 Error Boundary retry attempt ${this.retryCount}/${this.maxRetries}`);
      this.setState({ hasError: false, error: undefined, errorId: undefined });
    } else {
      console.log('❌ Max retries reached, reloading page...');
      window.location.reload();
    }
  };

  private handleGoHome = () => {
    this.retryCount = 0;
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError && this.state.error) {
      // Usar fallback personalizado si se proporciona
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.handleRetry);
      }

      // UI por defecto del Error Boundary
      return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6 text-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
            
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Algo salió mal
            </h1>
            
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {this.state.error.message}
            </p>

            <div className="space-y-3">
              {this.retryCount < this.maxRetries ? (
                <button
                  onClick={this.handleRetry}
                  className="w-full flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  Reintentar ({this.maxRetries - this.retryCount} intentos restantes)
                </button>
              ) : (
                <button
                  onClick={() => window.location.reload()}
                  className="w-full flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  Recargar Página
                </button>
              )}
              
              <button
                onClick={this.handleGoHome}
                className="w-full flex items-center justify-center gap-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg font-medium transition-colors hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <Home className="w-4 h-4" />
                Ir al Inicio
              </button>
            </div>

            {/* Información técnica colapsable */}
            <details className="mt-6 text-left">
              <summary className="text-sm text-gray-500 dark:text-gray-400 cursor-pointer hover:text-gray-700 dark:hover:text-gray-300">
                Información técnica
              </summary>
              <div className="mt-2 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                  <div><strong>Tipo:</strong> {this.state.error.type}</div>
                  <div><strong>Código:</strong> {this.state.error.code || 'N/A'}</div>
                  <div><strong>Timestamp:</strong> {this.state.error.timestamp.toLocaleString()}</div>
                  <div><strong>ID:</strong> {this.state.errorId}</div>
                </div>
              </div>
            </details>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Hook para usar Error Boundary programáticamente
 */
export function useErrorBoundary() {
  const throwError = (error: Error | string) => {
    const errorToThrow = error instanceof Error ? error : new Error(error);
    throw errorToThrow;
  };

  return { throwError };
}