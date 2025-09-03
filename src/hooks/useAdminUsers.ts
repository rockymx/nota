import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { AdminUser, UserStats, DashboardStats } from '../types/admin';
import { User } from '@supabase/supabase-js';

/**
 * Hook personalizado para manejar funciones de administrador
 */
export function useAdminUsers(user: User | null) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userStats, setUserStats] = useState<UserStats[]>([]);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);

  // Verificar si el usuario actual es administrador
  useEffect(() => {
    if (user) {
      checkAdminStatus();
    } else {
      setIsAdmin(false);
      setLoading(false);
    }
  }, [user]);

  // Cargar datos cuando el usuario es admin
  useEffect(() => {
    if (isAdmin && user) {
      loadAdminData();
    }
  }, [isAdmin, user]);

  /**
   * Verificar si el usuario actual es administrador
   */
  const checkAdminStatus = async () => {
    if (!user) return;

    try {
      console.log('🔐 Checking admin status for user:', user.id);
      
      const { data, error } = await (supabase as any)
        .from('admin_users')
        .select('id, is_active')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      const adminStatus = !!data;
      setIsAdmin(adminStatus);
      console.log('✅ Admin status checked:', adminStatus);
    } catch (error) {
      console.error('❌ Error checking admin status:', error);
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Cargar todos los datos del dashboard de administrador
   */
  const loadAdminData = async () => {
    if (!user || !isAdmin) return;

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
    }
  };

  /**
   * Agregar un nuevo administrador
   */
  const addAdmin = async (email: string) => {
    if (!user || !isAdmin) return false;

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

  /**
   * Remover administrador
   */
  const removeAdmin = async (userId: string) => {
    if (!user || !isAdmin) return false;

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

  /**
   * Desactivar/activar usuario (no eliminar, solo desactivar)
   */
  const toggleUserStatus = async (userId: string, isActive: boolean) => {
    if (!user || !isAdmin) return false;

    try {
      console.log('🔄 Toggling user status:', { userId, isActive });
      
      // Actualizar estado en admin_users si es admin
      const { error: adminError } = await (supabase as any)
        .from('admin_users')
        .update({ is_active: isActive })
        .eq('user_id', userId);

      // No lanzar error si no es admin, solo continuar
      
      await loadAdminData(); // Recargar datos
      console.log('✅ User status toggled successfully');
      return true;
    } catch (error) {
      console.error('❌ Error toggling user status:', error);
      throw error;
    }
  };

  return {
    isAdmin,
    loading,
    userStats,
    dashboardStats,
    addAdmin,
    removeAdmin,
    toggleUserStatus,
    refreshData: loadAdminData,
  };
}