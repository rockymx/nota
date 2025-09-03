import { useState, useEffect } from 'react';
import { Shield, Users, FileText, Folder, Sparkles, Activity, UserPlus, Search, ArrowLeft, Home } from 'lucide-react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';
import { UserStats, DashboardStats } from '../../types/admin';
import { AdminStats } from './AdminStats';
import { UsersList } from './UsersList';
import { AddAdminModal } from './AddAdminModal';

interface AdminPageProps {
  user: User;
  onGoHome: () => void;
}

export function AdminPage({ user, onGoHome }: AdminPageProps) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userStats, setUserStats] = useState<UserStats[]>([]);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddAdmin, setShowAddAdmin] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    checkAdminAndLoadData();
  }, [user]);

  const checkAdminAndLoadData = async () => {
    try {
      console.log('🔐 Checking admin status for:', user.email);
      
      // Verificar si es uno de los emails específicos de admin
      const adminEmails = ['2dcommx02@gmail.com', '2dcommx01@gmail.com'];
      if (adminEmails.includes(user.email || '')) {
        // Asegurar que esté en la tabla admin_users
        const { error: upsertError } = await (supabase as any)
          .from('admin_users')
          .upsert({
            user_id: user.id,
            created_by: user.id,
            is_active: true
          }, { onConflict: 'user_id' });

        if (upsertError) {
          console.error('Error setting up admin:', upsertError);
        }
        
        setIsAdmin(true);
        await loadAdminData();
      } else {
        // Verificar si es admin en la base de datos
        const { data, error } = await (supabase as any)
          .from('admin_users')
          .select('id, is_active')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') {
          throw error;
        }

        if (data) {
          setIsAdmin(true);
          await loadAdminData();
        } else {
          setError('No tienes permisos de administrador');
        }
      }
    } catch (error) {
      console.error('❌ Error checking admin status:', error);
      setError('Error verificando permisos de administrador');
    } finally {
      setLoading(false);
    }
  };

  const loadAdminData = async () => {
    try {
      console.log('📊 Loading admin dashboard data...');
      
      // Cargar estadísticas de usuarios
      const { data: statsData, error: statsError } = await (supabase as any)
        .from('admin_user_stats')
        .select('*');

      if (statsError) throw statsError;

      const loadedUserStats: UserStats[] = (statsData as any[]).map((stat: any) => ({
        id: stat.id,
        email: stat.email,
        registeredAt: new Date(stat.registered_at),
        totalNotes: stat.total_notes || 0,
        totalFolders: stat.total_folders || 0,
        customPrompts: stat.custom_prompts || 0,
        lastActivity: stat.last_activity ? new Date(stat.last_activity) : null,
      }));

      setUserStats(loadedUserStats);

      // Calcular estadísticas del dashboard
      const totalUsers = loadedUserStats.length;
      const totalNotes = loadedUserStats.reduce((sum, user) => sum + user.totalNotes, 0);
      const totalFolders = loadedUserStats.reduce((sum, user) => sum + user.totalFolders, 0);
      const totalPrompts = loadedUserStats.reduce((sum, user) => sum + user.customPrompts, 0);
      
      // Usuarios activos (con actividad en los últimos 30 días)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const activeUsers = loadedUserStats.filter(user => 
        user.lastActivity && user.lastActivity > thirtyDaysAgo
      ).length;

      // Nuevos usuarios este mes
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      const newUsersThisMonth = loadedUserStats.filter(user => 
        user.registeredAt > startOfMonth
      ).length;

      setDashboardStats({
        totalUsers,
        totalNotes,
        totalFolders,
        totalPrompts,
        activeUsers,
        newUsersThisMonth,
      });

      console.log('✅ Admin data loaded successfully');
    } catch (error) {
      console.error('❌ Error loading admin data:', error);
      setError('Error cargando datos del dashboard');
    }
  };

  const addAdmin = async (email: string) => {
    try {
      console.log('➕ Adding new admin:', email);
      
      // Buscar usuario por email
      const { data: userData, error: userError } = await (supabase as any)
        .from('users')
        .select('id')
        .eq('email', email)
        .single();

      if (userError) {
        if (userError.code === 'PGRST116') {
          throw new Error('Usuario no encontrado con ese email');
        }
        throw userError;
      }

      // Agregar como administrador
      const { error } = await (supabase as any)
        .from('admin_users')
        .insert({
          user_id: (userData as any).id,
          created_by: user.id,
        });

      if (error) {
        if (error.code === '23505') {
          throw new Error('Este usuario ya es administrador');
        }
        throw error;
      }

      await loadAdminData(); // Recargar datos
      console.log('✅ Admin added successfully');
      return true;
    } catch (error) {
      console.error('❌ Error adding admin:', error);
      throw error;
    }
  };

  const removeAdmin = async (userId: string) => {
    try {
      console.log('➖ Removing admin:', userId);
      
      // No permitir que se elimine a sí mismo
      if (userId === user.id) {
        throw new Error('No puedes eliminarte a ti mismo como administrador');
      }

      const { error } = await (supabase as any)
        .from('admin_users')
        .delete()
        .eq('user_id', userId);

      if (error) throw error;

      await loadAdminData(); // Recargar datos
      console.log('✅ Admin removed successfully');
      return true;
    } catch (error) {
      console.error('❌ Error removing admin:', error);
      throw error;
    }
  };

  const toggleUserStatus = async (userId: string, isActive: boolean) => {
    try {
      console.log('🔄 Toggling user status:', { userId, isActive });
      
      // Actualizar estado en admin_users si es admin
      const { error: adminError } = await (supabase as any)
        .from('admin_users')
        .update({ is_active: isActive })
        .eq('user_id', userId);

      await loadAdminData(); // Recargar datos
      console.log('✅ User status toggled successfully');
      return true;
    } catch (error) {
      console.error('❌ Error toggling user status:', error);
      throw error;
    }
  };

  // Filtrar usuarios por término de búsqueda
  const filteredUsers = userStats.filter(userStat =>
    userStat.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-app flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-app-primary">Verificando permisos de administrador...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-app flex items-center justify-center">
        <div className="text-center max-w-md">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-app-primary mb-2">Acceso Denegado</h1>
          <p className="text-app-secondary mb-6">
            {error || 'No tienes permisos para acceder al panel de administrador'}
          </p>
          <button
            onClick={onGoHome}
            className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium transition-colors mx-auto"
          >
            <Home className="w-4 h-4" />
            Volver al Inicio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-app">
      {/* Header */}
      <div className="border-b border-app bg-app">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center gap-4">
              <button
                onClick={onGoHome}
                className="p-2 rounded-lg hover:bg-app-secondary transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-app-secondary" />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-500 rounded-xl flex items-center justify-center">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-app-primary">Panel de Administrador</h1>
                  <p className="text-app-secondary">Gestiona usuarios y estadísticas del sistema</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm text-app-secondary">
                Administrador: <span className="font-medium text-app-primary">{user.email}</span>
              </div>
              <button
                onClick={() => setShowAddAdmin(true)}
                className="flex items-center gap-2 bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                <UserPlus className="w-4 h-4" />
                Agregar Admin
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Estadísticas generales */}
        {dashboardStats && (
          <div className="mb-8">
            <AdminStats stats={dashboardStats} />
          </div>
        )}

        {/* Búsqueda y filtros */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-app-primary">Usuarios Registrados</h2>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-app-tertiary" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar usuarios por email..."
                  className="pl-10 pr-4 py-2 border border-app rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-colors bg-app text-app-primary placeholder-app-tertiary w-64"
                />
              </div>
              <div className="text-sm text-app-secondary">
                {filteredUsers.length} de {userStats.length} usuarios
              </div>
            </div>
          </div>
        </div>

        {/* Lista de usuarios */}
        <UsersList
          users={filteredUsers}
          currentUserId={user.id}
          onRemoveAdmin={removeAdmin}
          onToggleUserStatus={toggleUserStatus}
        />
      </div>

      {/* Modal para agregar administrador */}
      {showAddAdmin && (
        <AddAdminModal
          onClose={() => setShowAddAdmin(false)}
          onAddAdmin={addAdmin}
        />
      )}
    </div>
  );
}