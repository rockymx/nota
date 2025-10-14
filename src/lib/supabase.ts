import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';

// Enhanced production debugging
console.log('🔧 Supabase Client Initialization...');
console.log('📍 Environment Mode:', import.meta.env.MODE);
console.log('🏭 Is Production:', import.meta.env.PROD);
console.log('🌐 Base URL:', import.meta.env.BASE_URL);

// Obtener variables de entorno de Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Enhanced debugging for production
console.log('🔧 Supabase Environment Variables Check:');
console.log('📍 VITE_SUPABASE_URL:', supabaseUrl || 'UNDEFINED');
console.log('🔑 VITE_SUPABASE_ANON_KEY exists:', !!supabaseAnonKey);
console.log('🔑 VITE_SUPABASE_ANON_KEY preview:', supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : 'MISSING');
console.log('📋 All available env vars:', Object.keys(import.meta.env));

// Validation checks
const urlValid = supabaseUrl?.includes('supabase.co') || supabaseUrl?.includes('supabase.in');
const keyValid = supabaseAnonKey?.startsWith('eyJ');
console.log('✅ URL Format Valid:', urlValid ? 'YES' : 'NO');
console.log('✅ Key Format Valid:', keyValid ? 'YES' : 'NO');

// Production-specific checks
if (import.meta.env.PROD) {
  console.log('🏭 PRODUCTION BUILD DETECTED');
  console.log('🔍 Production Environment Check:');
  console.log('  - URL set:', !!supabaseUrl);
  console.log('  - Key set:', !!supabaseAnonKey);
  console.log('  - URL format:', urlValid);
  console.log('  - Key format:', keyValid);
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('🚨 CRITICAL PRODUCTION ERROR: Missing Supabase environment variables');
    console.error('🚨 This will cause the app to fail in production');
  }
}

// Validar que las variables de entorno estén configuradas
if (!supabaseUrl || !supabaseAnonKey) {
  const errorMsg = 'Missing Supabase environment variables';
  console.error('❌', errorMsg);
  console.error('❌ VITE_SUPABASE_URL:', supabaseUrl || 'UNDEFINED');
  console.error('❌ VITE_SUPABASE_ANON_KEY exists:', !!supabaseAnonKey);
  
  if (import.meta.env.PROD) {
    console.error('🚨 PRODUCTION DEPLOYMENT FAILED: Environment variables not configured');
    console.error('🚨 Please configure Supabase environment variables in your deployment platform');
  }
  
  throw new Error(`${errorMsg}. Check deployment environment variables.`);
}

// Validar formato de URL y key
if (!urlValid) {
  console.error('❌ Invalid Supabase URL format:', supabaseUrl);
  throw new Error('Invalid Supabase URL format');
}

if (!keyValid) {
  console.error('❌ Invalid Supabase anon key format');
  throw new Error('Invalid Supabase anon key format');
}

console.log('✅ Supabase configuration validated successfully');

// Crear cliente de Supabase con tipos TypeScript
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storageKey: 'supabase.auth.token'
  }
});

console.log('✅ Supabase client created successfully');

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
    console.log('👤 Getting current user...');
    return supabase.auth.getUser();
  },

  // Escuchar cambios en el estado de autenticación
  onAuthStateChange: (callback: (event: string, session: any) => void) => {
    console.log('👂 Setting up auth state change listener...');
    return supabase.auth.onAuthStateChange(callback);
  },
};

console.log('✅ Auth helpers configured successfully');