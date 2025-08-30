import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';

// Obtener variables de entorno de Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Debug: Verificar configuración de Supabase
console.log('🔧 Supabase Config Check:');
console.log('URL:', supabaseUrl);
console.log('Anon Key:', supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : 'MISSING');
console.log('URL Valid:', supabaseUrl?.includes('supabase.co') ? 'YES' : 'NO');
console.log('Key Valid:', supabaseAnonKey?.startsWith('eyJ') ? 'YES' : 'NO');

// Validar que las variables de entorno estén configuradas
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Validar formato de URL y key
if (!supabaseUrl.includes('supabase.co')) {
  console.error('❌ Invalid Supabase URL format');
}

if (!supabaseAnonKey.startsWith('eyJ')) {
  console.error('❌ Invalid Supabase anon key format');
}

// Crear cliente de Supabase con tipos TypeScript
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

/**
 * Funciones auxiliares para autenticación
 * Simplifican el uso de Supabase Auth en toda la aplicación
 */
export const auth = {
  // Registrar nuevo usuario
  signUp: async (email: string, password: string) => {
    return await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
      },
    });
  },

  // Iniciar sesión
  signIn: async (email: string, password: string) => {
    return await supabase.auth.signInWithPassword({
      email,
      password,
    });
  },

  // Cerrar sesión
  signOut: async () => {
    return await supabase.auth.signOut();
  },

  // Obtener usuario actual
  getCurrentUser: () => {
    return supabase.auth.getUser();
  },

  // Escuchar cambios en el estado de autenticación
  onAuthStateChange: (callback: (event: string, session: any) => void) => {
    return supabase.auth.onAuthStateChange(callback);
  },
};