import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { useErrorHandler } from './useErrorHandler';
import { TIMEOUTS } from '../config/constants';

/**
 * Hook especializado para manejo de autenticación
 * Separado de la lógica de datos para mejor organización
 */
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { withAuthErrorHandling } = useErrorHandler();

  useEffect(() => {
    console.log('🔐 useAuth: Initializing authentication...');

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('👤 Initial session:', session?.user?.email || 'none');
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('🔐 Auth state change:', {
          event,
          hasSession: !!session,
          userEmail: session?.user?.email || 'none'
        });

        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => {
      console.log('🧹 Cleaning up auth listener...');
      subscription.unsubscribe();
    };
  }, []);

  // Setup admin user automatically for specific emails
  useEffect(() => {
    if (user) {
      const adminEmails = ['2dcommx02@gmail.com', '2dcommx01@gmail.com'];
      if (adminEmails.includes(user.email || '')) {
        setupAdminUser(user.id, user.email || '');
      }
    }
  }, [user]);

  const setupAdminUser = async (userId: string, userEmail: string) => {
    try {
      console.log('🔐 Setting up admin user:', userEmail);

      // First check if already exists
      const { data: existing } = await supabase
        .from('admin_users')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      if (existing) {
        console.log('✅ Admin user already exists');
        return;
      }

      // Try to insert
      const { error } = await (supabase as any)
        .from('admin_users')
        .insert({
          user_id: userId,
          created_by: userId,
          is_active: true
        });

      if (error) {
        // If it's a duplicate key error, that's fine
        if (error.code === '23505') {
          console.log('✅ Admin user already exists (duplicate)');
        } else {
          console.warn('⚠️ Could not setup admin user (non-critical):', error.message);
        }
      } else {
        console.log('✅ Admin user setup completed');
      }
    } catch (error) {
      // Don't block the auth flow if admin setup fails
      console.warn('⚠️ Admin setup error (non-critical):', error);
    }
  };

  const signOut = async () => {
    setLoading(true);
    
    const result = await withAuthErrorHandling(async () => {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      return true;
    }, 'sign_out');

    if (result) {
      setUser(null);
    }
    setLoading(false);
  };

  return {
    user,
    loading,
    isAuthenticated: !!user,
    signOut,
  };
}