import { useState, useCallback } from 'react';
import { ToastData, ToastType } from '../components/Toast';

/**
 * Hook para manejar sistema de toasts/notificaciones
 */
export function useToast() {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const addToast = useCallback((
    type: ToastType,
    title: string,
    message?: string,
    duration: number = 5000,
    action?: { label: string; onClick: () => void }
  ) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    
    const newToast: ToastData = {
      id,
      type,
      title,
      message,
      duration,
      action,
    };

    setToasts(prev => [...prev, newToast]);
    
    return id;
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const clearAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  // Funciones de conveniencia
  const success = useCallback((title: string, message?: string, action?: { label: string; onClick: () => void }) => {
    return addToast('success', title, message, 4000, action);
  }, [addToast]);

  const error = useCallback((title: string, message?: string) => {
    return addToast('error', title, message, 6000);
  }, [addToast]);

  const warning = useCallback((title: string, message?: string, action?: { label: string; onClick: () => void }) => {
    return addToast('warning', title, message, 5000, action);
  }, [addToast]);

  const info = useCallback((title: string, message?: string) => {
    return addToast('info', title, message, 4000);
  }, [addToast]);

  return {
    toasts,
    addToast,
    removeToast,
    clearAllToasts,
    success,
    error,
    warning,
    info,
  };
}