import { QueryClient } from '@tanstack/react-query';

/**
 * Configuración del cliente de React Query
 * Optimizado para la aplicación de notas
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Configuración por defecto para queries
      staleTime: 5 * 60 * 1000, // 5 minutos - datos considerados frescos
      gcTime: 10 * 60 * 1000, // 10 minutos - tiempo en cache
      retry: (failureCount, error) => {
        // No reintentar en errores de autenticación
        if (error instanceof Error) {
          if (error.message.includes('session_not_found') ||
              error.message.includes('JWT expired') ||
              error.message.includes('403') ||
              error.message.includes('unauthorized')) {
            return false;
          }
        }
        // Reintentar hasta 3 veces para otros errores
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      // Configuración por defecto para mutations
      retry: (failureCount, error) => {
        // No reintentar mutations en errores de autenticación
        if (error instanceof Error) {
          if (error.message.includes('session_not_found') ||
              error.message.includes('JWT expired') ||
              error.message.includes('403') ||
              error.message.includes('unauthorized')) {
            return false;
          }
        }
        // Reintentar una vez para errores de red
        return failureCount < 1;
      },
    },
  },
});

/**
 * Funciones auxiliares para invalidación de cache
 */
export const cacheUtils = {
  // Invalidar todos los datos de un usuario
  invalidateUserData: (userId: string) => {
    queryClient.invalidateQueries({ queryKey: ['notes', userId] });
    queryClient.invalidateQueries({ queryKey: ['folders', userId] });
    queryClient.invalidateQueries({ queryKey: ['ai-prompts', userId] });
  },

  // Limpiar cache al cerrar sesión
  clearUserCache: (userId: string) => {
    queryClient.removeQueries({ queryKey: ['notes', userId] });
    queryClient.removeQueries({ queryKey: ['folders', userId] });
    queryClient.removeQueries({ queryKey: ['ai-prompts', userId] });
  },

  // Prefetch de datos relacionados
  prefetchRelatedData: async (userId: string) => {
    await Promise.all([
      queryClient.prefetchQuery({
        queryKey: ['folders', userId],
        staleTime: 10 * 60 * 1000,
      }),
      queryClient.prefetchQuery({
        queryKey: ['ai-prompts', userId],
        staleTime: 15 * 60 * 1000,
      }),
    ]);
  },
};