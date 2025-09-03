import { useState, useEffect } from 'react';
import { Shield, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';

interface AdminSetupProps {
  user: User;
  onComplete: () => void;
}

export function AdminSetup({ user, onComplete }: AdminSetupProps) {
  const [checking, setChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [settingUpAdmin, setSettingUpAdmin] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    checkAndSetupAdmin();
  }, [user]);

  const checkAndSetupAdmin = async () => {
    try {
      console.log('🔍 Checking admin status for:', user.email);
      
      // Verificar si el usuario ya es administrador
      const { data: adminData, error: adminError } = await (supabase as any)
        .from('admin_users')
        .select('id, is_active')
        .eq('user_id', user.id)
        .maybeSingle();

      if (adminError && adminError.code !== 'PGRST116') {
        throw adminError;
      }

      if (adminData && adminData.is_active) {
        console.log('✅ User is already admin');
        setIsAdmin(true);
        setSuccess('Ya eres administrador del sistema');
        setTimeout(() => onComplete(), 2000);
        return;
      }

      // Si el email coincide con el target, convertir en admin
      if (user.email === '2dcommx02@gmail.com') {
        console.log('🎯 Target email detected, setting up as admin...');
        setSettingUpAdmin(true);
        
        const { error: insertError } = await (supabase as any)
          .from('admin_users')
          .insert({
            user_id: user.id,
            created_by: user.id,
            is_active: true
          });

        if (insertError && insertError.code !== '23505') { // 23505 = unique violation (ya existe)
          throw insertError;
        }

        setIsAdmin(true);
        setSuccess('¡Felicidades! Ahora eres administrador del sistema');
        console.log('✅ Admin setup completed successfully');
        setTimeout(() => onComplete(), 3000);
      } else {
        console.log('ℹ️ User is not target admin email');
        setError('Tu cuenta no tiene permisos de administrador');
        setTimeout(() => onComplete(), 3000);
      }

    } catch (error) {
      console.error('❌ Error in admin setup:', error);
      setError('Error verificando permisos de administrador');
      setTimeout(() => onComplete(), 3000);
    } finally {
      setChecking(false);
      setSettingUpAdmin(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-app rounded-xl shadow-app-xl w-full max-w-md p-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          
          <h2 className="text-xl font-bold text-app-primary mb-2">
            Verificación de Administrador
          </h2>
          
          <p className="text-app-secondary mb-6">
            Verificando permisos para: {user.email}
          </p>

          {checking && (
            <div className="flex items-center justify-center gap-3 text-app-secondary">
              <Loader className="w-5 h-5 animate-spin" />
              <span>Verificando permisos...</span>
            </div>
          )}

          {settingUpAdmin && (
            <div className="flex items-center justify-center gap-3 text-purple-600">
              <Loader className="w-5 h-5 animate-spin" />
              <span>Configurando permisos de administrador...</span>
            </div>
          )}

          {success && (
            <div className="flex items-center justify-center gap-3 text-green-600">
              <CheckCircle className="w-5 h-5" />
              <span>{success}</span>
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center gap-3 text-red-600">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          )}

          {isAdmin && !checking && (
            <div className="mt-4 p-3 bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-700 rounded-lg">
              <p className="text-sm text-purple-700 dark:text-purple-300">
                Tendrás acceso al Panel de Administrador en el sidebar
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}