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
    
    const initializeAuth = async () => {
      const result = await withAuthErrorHandling(async () => {
        console.log('👤 Getting current user...');
        
        // Clear any invalid session first
        const { data: { session } } = await supabase.auth.getSession();
        if (session && session.expires_at && new Date(session.expires_at * 1000) < new Date()) {
          console.log('🔓 Session expired, clearing...');
          await supabase.auth.signOut();
          return null;
        }
        
        // Get current user with timeout
        const getUserPromise = supabase.auth.getUser();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Auth timeout')), TIMEOUTS.AUTH)
        );
        
        const { data: { user }, error: authError } = await Promise.race([
          getUserPromise, 
          timeoutPromise
        ]) as any;

        if (authError) throw authError;

        console.log('👤 Auth result:', {
          hasUser: !!user,
          email: user?.email || 'none',
          id: user?.id || 'none'
        });
        
        return user;
      }, 'initialize_auth');

      setUser(result);
      setLoading(false);
    };

    initializeAuth();

    // Listen to auth state changes
    console.log('👂 Setting up auth state change listener...');
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
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
        setupAdminUser(user.id);
      }
    }
  }, [user]);

  const setupAdminUser = async (userId: string) => {
    try {
      console.log('🔐 Setting up admin user:', userId);
      
      const { error } = await (supabase as any)
        .from('admin_users')
        .upsert({
          user_id: userId,
          created_by: userId,
          is_active: true
        }, { 
          onConflict: 'user_id',
          ignoreDuplicates: true 
        });

      if (error && !error.message.includes('duplicate')) {
        console.error('Error setting up admin user:', error);
      } else {
        console.log('✅ Admin user setup completed');
      }
    } catch (error) {
      console.error('❌ Error in setupAdminUser:', error);
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