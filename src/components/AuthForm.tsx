import React, { useState } from 'react';
import { Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import { auth } from '../lib/supabase';
import { useFormValidation } from '../hooks/useFormValidation';
import { schemas } from '../lib/validation';
import { ValidatedInput } from './forms/ValidatedInput';
import { z } from 'zod';

interface AuthFormProps {
  onSuccess: () => void;
}

const authSchema = z.object({
  email: schemas.email,
  password: schemas.password,
});
export function AuthForm({ onSuccess }: AuthFormProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const {
    fields,
    formState,
    getFieldProps,
    validateForm,
    resetForm,
  } = useFormValidation(authSchema, {
    email: '',
    password: '',
  });
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = validateForm();
    if (!validation.valid) {
      setError('Por favor corrige los errores en el formulario');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { email, password } = validation.data!;
      
      if (isLogin) {
        const { error } = await auth.signIn(email, password);
        if (error) throw error;
      } else {
        const { error } = await auth.signUp(email, password);
        if (error) throw error;
      }
      onSuccess();
    } catch (error: any) {
      // Handle rate limit errors specifically
      if (error.message && error.message.includes('over_email_send_rate_limit')) {
        const match = error.message.match(/after (\d+) seconds/);
        const waitTime = match ? match[1] : '60';
        setError(`Demasiados intentos de autenticación. Por favor espera ${waitTime} segundos antes de intentar nuevamente.`);
      } else if (error.code === 'invalid_credentials') {
        setError('Credenciales incorrectas. Verifica tu email y contraseña.');
      } else if (error.message && error.message.includes('User already registered')) {
        setError('Este email ya está registrado. Intenta iniciar sesión en su lugar.');
      } else {
        setError(error.message || 'Ha ocurrido un error');
      }
    } finally {
      setLoading(false);
    }
  };

  // Resetear formulario cuando cambia el modo
  React.useEffect(() => {
    resetForm({ email: '', password: '' });
    setError('');
  }, [isLogin, resetForm]);
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4 transition-colors duration-300">
      <div className="bg-app rounded-2xl shadow-app-xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-app-primary mb-2">
            {isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}
          </h1>
          <p className="text-app-secondary">
            {isLogin ? 'Accede a tus notas' : 'Únete para guardar tus notas'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg p-3">
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          <ValidatedInput
            {...getFieldProps('email')}
            type="email"
            label="Correo electrónico"
            placeholder="tu@email.com"
            leftIcon={<Mail className="w-5 h-5" />}
            required
            showValidIcon
            className="py-3"
          />

          <ValidatedInput
            {...getFieldProps('password')}
            type={showPassword ? 'text' : 'password'}
            label="Contraseña"
            placeholder="••••••••"
            leftIcon={<Lock className="w-5 h-5" />}
            rightIcon={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-app-tertiary hover:text-app-secondary"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            }
            required
            showValidIcon
            className="py-3"
            helperText="Mínimo 6 caracteres, debe contener al menos una letra"
          />

          <button
            type="submit"
            disabled={loading || !formState.isValid}
            className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white py-3 rounded-lg font-medium transition-colors flex items-center justify-center"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-blue-500 hover:text-blue-600 text-sm font-medium"
          >
            {isLogin 
              ? '¿No tienes cuenta? Regístrate' 
              : '¿Ya tienes cuenta? Inicia sesión'
            }
          </button>
        </div>
      </div>
    </div>
  );
}