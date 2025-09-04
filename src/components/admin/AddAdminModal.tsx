import React, { useState } from 'react';
import { X, UserPlus, Mail } from 'lucide-react';
import { useFormValidation } from '../../hooks/useFormValidation';
import { schemas } from '../../lib/validation';
import { ValidatedInput } from '../forms/ValidatedInput';
import { z } from 'zod';

interface AddAdminModalProps {
  onClose: () => void;
  onAddAdmin: (email: string) => Promise<boolean>;
}

const addAdminSchema = z.object({
  email: schemas.email,
});
export function AddAdminModal({ onClose, onAddAdmin }: AddAdminModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const {
    formState,
    getFieldProps,
    validateForm,
  } = useFormValidation(addAdminSchema, {
    email: '',
  });
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = validateForm();
    if (!validation.valid) {
      const firstError = Object.values(validation.errors)[0];
      setError(firstError || 'Email inválido');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const result = await onAddAdmin(validation.data!.email);
      if (result) {
        setSuccess('Administrador agregado exitosamente');
        setTimeout(() => {
          onClose();
        }, 1500);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error agregando administrador');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-app rounded-xl shadow-app-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-app">
          <div className="flex items-center gap-3">
            <UserPlus className="w-6 h-6 text-blue-600" />
            <h2 className="text-lg font-semibold text-app-primary">Agregar Administrador</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-app-secondary transition-colors"
          >
            <X className="w-5 h-5 text-app-secondary" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
            <h3 className="font-medium text-blue-900 dark:text-blue-300 mb-2">Agregar Administrador</h3>
            <p className="text-sm text-blue-700 dark:text-blue-400">
              Ingresa el email de un usuario registrado para otorgarle permisos de administrador.
            </p>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg p-3">
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded-lg p-3">
              <p className="text-sm text-green-700 dark:text-green-300">{success}</p>
            </div>
          )}

          <ValidatedInput
            {...getFieldProps('email')}
            type="email"
            label="Email del usuario"
            placeholder="usuario@ejemplo.com"
            leftIcon={<Mail className="w-4 h-4" />}
            required
            autoFocus
            showValidIcon
            helperText="Email de un usuario ya registrado en la plataforma"
          />

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-app text-app-primary rounded-lg hover:bg-app-secondary transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !formState.isValid}
              className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  Agregar Admin
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}