import { useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Mail, Calendar, FileText, Folder, Sparkles, Shield, Trash2, MoreVertical } from 'lucide-react';
import { UserStats } from '../../types/admin';

interface UserCardProps {
  user: UserStats;
  isCurrentUser: boolean;
  onRemoveAdmin: (userId: string) => Promise<boolean>;
  onToggleUserStatus: (userId: string, isActive: boolean) => Promise<boolean>;
}

export function UserCard({ user, isCurrentUser, onRemoveAdmin, onToggleUserStatus }: UserCardProps) {
  const [showActions, setShowActions] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRemoveAdmin = async () => {
    if (isCurrentUser) return;
    
    setLoading(true);
    try {
      await onRemoveAdmin(user.id);
    } catch (error) {
      console.error('Error removing admin:', error);
    } finally {
      setLoading(false);
      setShowActions(false);
    }
  };

  const getActivityStatus = () => {
    if (!user.lastActivity) return { text: 'Sin actividad', color: 'text-gray-500' };
    
    const daysSinceActivity = Math.floor(
      (new Date().getTime() - user.lastActivity.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    if (daysSinceActivity === 0) return { text: 'Activo hoy', color: 'text-green-600' };
    if (daysSinceActivity <= 7) return { text: `Activo hace ${daysSinceActivity} días`, color: 'text-green-500' };
    if (daysSinceActivity <= 30) return { text: `Activo hace ${daysSinceActivity} días`, color: 'text-yellow-500' };
    return { text: `Inactivo ${daysSinceActivity} días`, color: 'text-red-500' };
  };

  const activityStatus = getActivityStatus();

  return (
    <div className="bg-app border border-app rounded-lg p-4 hover:shadow-app-sm transition-all duration-200">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {/* Header con email y estado */}
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white font-medium text-sm">
                {user.email.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-medium text-app-primary">{user.email}</h3>
                {isCurrentUser && (
                  <span className="inline-flex items-center gap-1 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                    <Shield className="w-3 h-3" />
                    Tú
                  </span>
                )}
              </div>
              <p className={`text-xs ${activityStatus.color}`}>
                {activityStatus.text}
              </p>
            </div>
          </div>

          {/* Estadísticas del usuario */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-500" />
              <div>
                <p className="text-sm font-medium text-app-primary">{user.totalNotes}</p>
                <p className="text-xs text-app-secondary">Notas</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Folder className="w-4 h-4 text-green-500" />
              <div>
                <p className="text-sm font-medium text-app-primary">{user.totalFolders}</p>
                <p className="text-xs text-app-secondary">Carpetas</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-500" />
              <div>
                <p className="text-sm font-medium text-app-primary">{user.customPrompts}</p>
                <p className="text-xs text-app-secondary">Prompts</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-yellow-500" />
              <div>
                <p className="text-xs font-medium text-app-primary">
                  {format(user.registeredAt, 'dd MMM yyyy', { locale: es })}
                </p>
                <p className="text-xs text-app-secondary">Registro</p>
              </div>
            </div>
          </div>
        </div>

        {/* Menú de acciones */}
        <div className="relative">
          <button
            onClick={() => setShowActions(!showActions)}
            className="p-2 rounded-lg hover:bg-app-secondary transition-colors"
            disabled={loading}
          >
            <MoreVertical className="w-4 h-4 text-app-secondary" />
          </button>

          {showActions && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowActions(false)}
              />
              <div className="absolute top-full right-0 mt-1 w-48 bg-app rounded-lg shadow-app-lg border border-app z-20">
                <div className="p-1">
                  {!isCurrentUser && (
                    <button
                      onClick={handleRemoveAdmin}
                      disabled={loading}
                      className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Remover Admin
                    </button>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}