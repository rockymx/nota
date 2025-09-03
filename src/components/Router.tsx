import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { AuthForm } from './AuthForm';
import { AdminPage } from './admin/AdminPage';
import App from '../App';

export function Router() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    console.log('🔐 Router: Auth effect triggered');
    // Obtener usuario actual
    const getUser = async () => {
      try {
        console.log('👤 Getting current user...');
        const { data: { user } } = await supabase.auth.getUser();
        console.log('👤 User result:', user ? `${user.email} (${user.id})` : 'none');
        setUser(user);
      } catch (error) {
        console.error('Error getting user:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    getUser();

    // Escuchar cambios en la autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔐 Auth state change:', event, session?.user?.email || 'none');
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // Escuchar cambios en la URL
    const handlePopState = () => {
      const newPath = window.location.pathname;
      console.log('🌐 Route changed to:', newPath);
      setCurrentPath(newPath);
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  const navigateTo = (path: string) => {
    console.log('🧭 Navigating to:', path);
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
    user: user.email,
    isAdminEmail: ['2dcommx02@gmail.com', '2dcommx01@gmail.com'].includes(user.email || '')
  });

  // Routing simple
  if (currentPath === '/admin') {
    console.log('🏛️ Rendering AdminPage');
    return <AdminPage user={user} onGoHome={goHome} />;
  }

  console.log('🏠 Rendering main App');
  return <App />;
}