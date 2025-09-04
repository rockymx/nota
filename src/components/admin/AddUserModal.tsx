import React, { useState } from 'react';
import { X, UserPlus, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useFormValidation } from '../../hooks/useFormValidation';
import { schemas } from '../../lib/validation';
import { ValidatedInput } from '../forms/ValidatedInput';
import { z } from 'zod';

interface AddUserModalProps {
  onClose: () => void;
  onAddUser: (email: string, password: string) => Promise<boolean>;
}

const createUserSchema = z.object({
  email: schemas.email,
  password: schemas.password,
  confirmPassword: schemas.password,
}).refine(data => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
});
export function AddUserModal({ onClose, onAddUser }: AddUserModalProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const {
    fields,
    formState,
    getFieldProps,
    validateForm,
  } = useFormValidation(createUserSchema, {
    email: '',
    password: '',
    confirmPassword: '',
  });
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = validateForm();
    if (!validation.valid) {
      const firstError = Object.values(validation.errors)[0];
      setError(firstError || 'Por favor corrige los errores en el formulario');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const { email, password } = validation.data!;
      const result = await onAddUser(email, password);
      if (result) {
        setSuccess('Usuario creado exitosamente');
        setTimeout(() => {
          onClose();
        }, 1500);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error creando usuario');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-app rounded-xl shadow-app-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-app">
          <div className="flex items-center gap-3">
            <UserPlus className="w-6 h-6 text-green-600" />
            <h2 className="text-lg font-semibold text-app-primary">Crear Usuario</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-app-secondary transition-colors"
          >
            <X className="w-5 h-5 text-app-secondary" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded-lg p-4">
            <h3 className="font-medium text-green-900 dark:text-green-300 mb-2">Crear Usuario Normal</h3>
            <p className="text-sm text-green-700 dark:text-green-400">
              Crea una nueva cuenta de usuario con email y contraseña. El usuario podrá acceder a la aplicación inmediatamente.
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
          />

          <ValidatedInput
            {...getFieldProps('password')}
            type={showPassword ? 'text' : 'password'}
            label="Contraseña"
            placeholder="Mínimo 6 caracteres"
            leftIcon={<Lock className="w-4 h-4" />}
            rightIcon={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-app-tertiary hover:text-app-secondary"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            }
            required
            showValidIcon
          />

          <ValidatedInput
            {...getFieldProps('confirmPassword')}
            type={showConfirmPassword ? 'text' : 'password'}
            label="Confirmar contraseña"
            placeholder="Repite la contraseña"
            leftIcon={<Lock className="w-4 h-4" />}
            rightIcon={
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="text-app-tertiary hover:text-app-secondary"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            }
            required
            showValidIcon
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
              className="flex-1 bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  Crear Usuario
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}