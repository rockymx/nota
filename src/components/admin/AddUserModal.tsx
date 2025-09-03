import React, { useState } from 'react';
import { X, UserPlus, Mail, Lock, Eye, EyeOff } from 'lucide-react';

interface AddUserModalProps {
  onClose: () => void;
  onAddUser: (email: string, password: string) => Promise<boolean>;
}

export function AddUserModal({ onClose, onAddUser }: AddUserModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setError('Ingresa un email válido');
      return;
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const result = await onAddUser(email.trim(), password);
      if (result) {
        setSuccess('Usuario creado exitosamente');
        setEmail('');
        setPassword('');
        setConfirmPassword('');
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

          <div>
            <label className="block text-sm font-medium text-app-primary mb-2">
              Email del usuario
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-app-tertiary" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="usuario@ejemplo.com"
                className="w-full pl-10 pr-4 py-2 border border-app rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-colors bg-app text-app-primary placeholder-app-tertiary"
                required
                autoFocus
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-app-primary mb-2">
              Contraseña
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-app-tertiary" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="w-full pl-10 pr-12 py-2 border border-app rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-colors bg-app text-app-primary placeholder-app-tertiary"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-app-tertiary hover:text-app-secondary"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-app-primary mb-2">
              Confirmar contraseña
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-app-tertiary" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repite la contraseña"
                className="w-full pl-10 pr-12 py-2 border border-app rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-colors bg-app text-app-primary placeholder-app-tertiary"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-app-tertiary hover:text-app-secondary"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

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
              disabled={loading || !email.trim() || !password.trim() || !confirmPassword.trim()}
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