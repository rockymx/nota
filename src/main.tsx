import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { ErrorBoundary } from './components/ErrorBoundary'
import './index.css'
import { Router } from './components/Router'
import { queryClient } from './lib/queryClient'

// Production deployment debugging
console.log('🚀 Starting NotesApp...');
console.log('📍 Environment:', import.meta.env.MODE);
console.log('🌐 Base URL:', import.meta.env.BASE_URL);
console.log('🔗 Supabase URL:', import.meta.env.VITE_SUPABASE_URL || 'NOT_SET');
console.log('🔑 Supabase Key exists:', !!import.meta.env.VITE_SUPABASE_ANON_KEY);
console.log('📦 All env vars:', Object.keys(import.meta.env));

// Check if we're in production and missing env vars
if (import.meta.env.PROD) {
  console.log('🏭 PRODUCTION MODE DETECTED');
  if (!import.meta.env.VITE_SUPABASE_URL) {
    console.error('❌ CRITICAL: VITE_SUPABASE_URL not set in production');
  }
  if (!import.meta.env.VITE_SUPABASE_ANON_KEY) {
    console.error('❌ CRITICAL: VITE_SUPABASE_ANON_KEY not set in production');
  }
}

try {
  console.log('📦 Creating React root...');
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    console.error('❌ CRITICAL: Root element #root not found in DOM');
    throw new Error('Root element not found');
  }
  
  const root = createRoot(rootElement);
  console.log('✅ React root created successfully');
  
  console.log('🎯 Rendering App component...');
  root.render(
    <StrictMode>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <Router />
          {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
        </QueryClientProvider>
      </ErrorBoundary>
    </StrictMode>,
  );
  console.log('✅ App component rendered successfully');
} catch (error) {
  console.error('❌ Error during app initialization:', error);
  console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace');
  
  // Mostrar error en la página
  const rootElement = document.getElementById('root');
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="padding: 20px; text-align: center; font-family: Arial, sans-serif;">
        <h1 style="color: #dc2626;">NotesApp - Error de inicialización</h1>
        <p style="color: #6b7280; margin: 10px 0;">La aplicación no pudo iniciarse correctamente en producción.</p>
        <div style="background: #fef2f2; border: 1px solid #fecaca; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #dc2626; margin: 0 0 10px 0;">Posibles causas:</h3>
          <ul style="text-align: left; color: #7f1d1d;">
            <li>Variables de entorno de Supabase no configuradas</li>
            <li>Error en la configuración de build</li>
            <li>Problema de conectividad con Supabase</li>
          </ul>
        </div>
        <pre style="background: #f3f4f6; padding: 10px; border-radius: 8px; text-align: left; overflow: auto;">
${error instanceof Error ? error.message : String(error)}
        </pre>
        <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
          Revisa la consola del navegador para más detalles.
        </p>
        <div style="margin-top: 20px;">
          <button onclick="window.location.reload()" style="background: #3b82f6; color: white; padding: 10px 20px; border: none; border-radius: 8px; cursor: pointer;">
            Reintentar
          </button>
        </div>
      </div>
    `;
  }
}