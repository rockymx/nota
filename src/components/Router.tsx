import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { AuthForm } from './AuthForm';
import { AdminPage } from './admin/AdminPage';
import App from '../App';
import { useAuth } from '../hooks/useAuth';

export function Router() {
  const { user, loading } = useAuth();
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    console.log('🌐 Current path:', window.location.pathname);

    // Escuchar cambios en la URL
    const handlePopState = () => {
      const newPath = window.location.pathname;
      console.log('🌐 Route changed to:', newPath);
      setCurrentPath(newPath);
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  const navigateTo = (path: string) => {
    console.log('🧭 Navigating to:', path);
    console.log('🌐 From:', window.location.pathname, 'To:', path);
    window.history.pushState({}, '', path);
    setCurrentPath(path);
  };

  const goHome = () => navigateTo('/');

  if (loading) {
    return (
      console.log('⏳ Rendering loading screen...'),
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Cargando NotesApp...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    console.log('🔓 No user, showing auth form');
    return <AuthForm onSuccess={goHome} />;
  }

  console.log('🎯 Routing decision:', {
    currentPath,
    windowPath: window.location.pathname,
    user: user.email,
    isAdminEmail: ['2dcommx02@gmail.com', '2dcommx01@gmail.com'].includes(user.email || '')
  });

  // Ensure currentPath matches actual window location
  if (currentPath !== window.location.pathname) {
    console.log('🔄 Path mismatch detected, syncing:', {
      currentPath,
      windowPath: window.location.pathname
    });
    setCurrentPath(window.location.pathname);
  }

  // Routing simple
  if (currentPath === '/admin' || window.location.pathname === '/admin') {
    console.log('🏛️ Rendering AdminPage');
    return <AdminPage user={user} onGoHome={goHome} />;
  }

  console.log('🏠 Rendering main App');
  return <App />;
}