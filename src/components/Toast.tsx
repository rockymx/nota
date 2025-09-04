import { useState, useEffect } from 'react';
import { X, Undo2, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastData {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastProps {
  toast: ToastData;
  onDismiss: (id: string) => void;
}

export function Toast({ toast, onDismiss }: ToastProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    // Animación de entrada
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (toast.duration && toast.duration > 0) {
      const timer = setTimeout(() => {
        handleDismiss();
      }, toast.duration);
      return () => clearTimeout(timer);
    }
  }, [toast.duration]);

  const handleDismiss = () => {
    setIsLeaving(true);
    setTimeout(() => {
      onDismiss(toast.id);
    }, 300);
  };

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'info':
      default:
        return <Info className="w-5 h-5 text-blue-600" />;
    }
  };

  const getStyles = () => {
    const baseStyles = "border-l-4";
    switch (toast.type) {
      case 'success':
        return `${baseStyles} bg-green-50 dark:bg-green-900/30 border-green-400 dark:border-green-600`;
      case 'error':
        return `${baseStyles} bg-red-50 dark:bg-red-900/30 border-red-400 dark:border-red-600`;
      case 'warning':
        return `${baseStyles} bg-yellow-50 dark:bg-yellow-900/30 border-yellow-400 dark:border-yellow-600`;
      case 'info':
      default:
        return `${baseStyles} bg-blue-50 dark:bg-blue-900/30 border-blue-400 dark:border-blue-600`;
    }
  };

  return (
    <div
      className={`
        transform transition-all duration-300 ease-in-out
        ${isVisible && !isLeaving ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
        ${getStyles()}
        rounded-lg shadow-lg p-4 mb-3 max-w-sm w-full
      `}
    >
      <div className="flex items-start gap-3">
        {getIcon()}
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-app-primary">{toast.title}</h4>
          {toast.message && (
            <p className="text-sm text-app-secondary mt-1">{toast.message}</p>
          )}
          {toast.action && (
            <button
              onClick={toast.action.onClick}
              className="inline-flex items-center gap-1 mt-2 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
            >
              <Undo2 className="w-4 h-4" />
              {toast.action.label}
            </button>
          )}
        </div>
        <button
          onClick={handleDismiss}
          className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
        >
          <X className="w-4 h-4 text-app-secondary" />
        </button>
      </div>
    </div>
  );
}