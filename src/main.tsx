import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

console.log('🚀 Starting application...');
console.log('Environment:', import.meta.env.MODE);
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('Supabase Key exists:', !!import.meta.env.VITE_SUPABASE_ANON_KEY);

try {
  console.log('📦 Creating React root...');
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    throw new Error('Root element not found');
  }
  
  const root = createRoot(rootElement);
  console.log('✅ React root created successfully');
  
  console.log('🎯 Rendering App component...');
  root.render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
  console.log('✅ App component rendered successfully');
} catch (error) {
  console.error('❌ Error during app initialization:', error);
  
  // Mostrar error en la página
  const rootElement = document.getElementById('root');
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="padding: 20px; text-align: center; font-family: Arial, sans-serif;">
        <h1 style="color: #dc2626;">Error de inicialización</h1>
        <p style="color: #6b7280; margin: 10px 0;">La aplicación no pudo iniciarse correctamente.</p>
        <pre style="background: #f3f4f6; padding: 10px; border-radius: 8px; text-align: left; overflow: auto;">
${error instanceof Error ? error.message : String(error)}
        </pre>
        <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
          Revisa la consola del navegador para más detalles.
        </p>
      </div>
    `;
  }
}