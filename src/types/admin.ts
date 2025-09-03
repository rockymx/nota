/**
 * Tipos TypeScript para el sistema de administración
 */

/**
 * Interfaz para un usuario administrador
 */
export interface AdminUser {
  id: string;
  userId: string;
  createdAt: Date;
  isActive: boolean;
  createdBy: string | null;
}

/**
 * Interfaz para estadísticas de usuario en el dashboard admin
 */
export interface UserStats {
  id: string;
  email: string;
  registeredAt: Date;
  totalNotes: number;
  totalFolders: number;
  customPrompts: number;
  lastActivity: Date | null;
}

/**
 * Interfaz para estadísticas generales del dashboard
 */
export interface DashboardStats {
  totalUsers: number;
  totalNotes: number;
  totalFolders: number;
  totalPrompts: number;
  activeUsers: number;
  newUsersThisMonth: number;
}

/**
 * Interfaz para acciones de administrador sobre usuarios
 */
export interface UserAction {
  type: 'activate' | 'deactivate' | 'view_details' | 'delete';
  userId: string;
  reason?: string;
}