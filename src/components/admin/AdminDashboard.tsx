import { useState } from 'react';
import { ArrowLeft, Users, FileText, Folder, Sparkles, UserPlus, Search } from 'lucide-react';
import { User } from '@supabase/supabase-js';
import { UserStats, DashboardStats } from '../../types/admin';
import { UsersList } from './UsersList';
import { AdminStats } from './AdminStats';
import { AddAdminModal } from './AddAdminModal';

interface AdminDashboardProps {
  user: User;
  userStats: UserStats[];
  dashboardStats: DashboardStats | null;
  onBack: () => void;
  onAddAdmin: (email: string) => Promise<boolean>;
  onRemoveAdmin: (userId: string) => Promise<boolean>;
  onToggleUserStatus: (userId: string, isActive: boolean) => Promise<boolean>;
}

export function AdminDashboard({ 
  user, 
  userStats, 
  dashboardStats, 
  onBack,
  onAddAdmin,
  onRemoveAdmin,
  onToggleUserStatus
}: AdminDashboardProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddAdmin, setShowAddAdmin] = useState(false);

  // Filtrar usuarios por término de búsqueda
  const filteredUsers = userStats.filter(userStat =>
    userStat.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-full bg-app flex flex-col transition-colors duration-300">
      {/* Header */}
      <div className="border-b border-app p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2 rounded-lg hover:bg-app-secondary transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-app-secondary" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-app-primary">Panel de Administrador</h1>
              <p className="text-app-secondary">Gestiona usuarios y estadísticas del sistema</p>
            </div>
          </div>
          <button
            onClick={() => setShowAddAdmin(true)}
            className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            Agregar Admin
          </button>
        </div>
      </div>

      {/* Estadísticas generales */}
      {dashboardStats && (
        <div className="p-6 border-b border-app">
          <AdminStats stats={dashboardStats} />
        </div>
      )}

      {/* Búsqueda y filtros */}
      <div className="p-6 border-b border-app">
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-app-tertiary" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar usuarios por email..."
              className="w-full pl-10 pr-4 py-2 border border-app rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors bg-app text-app-primary placeholder-app-tertiary"
            />
          </div>
          <div className="text-sm text-app-secondary">
            {filteredUsers.length} de {userStats.length} usuarios
          </div>
        </div>
      </div>

      {/* Lista de usuarios */}
      <div className="flex-1 overflow-y-auto">
        <UsersList
          users={filteredUsers}
          currentUserId={user.id}
          onRemoveAdmin={onRemoveAdmin}
          onToggleUserStatus={onToggleUserStatus}
        />
      </div>

      {/* Modal para agregar administrador */}
      {showAddAdmin && (
        <AddAdminModal
          onClose={() => setShowAddAdmin(false)}
          onAddAdmin={onAddAdmin}
        />
      )}
    </div>
  );
}