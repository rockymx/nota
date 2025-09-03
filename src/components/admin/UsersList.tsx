import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { UserStats } from '../../types/admin';
import { UserCard } from './UserCard';

interface UsersListProps {
  users: UserStats[];
  currentUserId: string;
  onRemoveAdmin: (userId: string) => Promise<boolean>;
  onToggleUserStatus: (userId: string, isActive: boolean) => Promise<boolean>;
}

export function UsersList({ users, currentUserId, onRemoveAdmin, onToggleUserStatus }: UsersListProps) {
  if (users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-app-secondary p-8">
        <div className="text-center">
          <h3 className="text-lg font-medium mb-2 text-app-primary">No se encontraron usuarios</h3>
          <p className="text-sm">Intenta ajustar los filtros de búsqueda</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="space-y-4">
        {users.map((userStat) => (
          <UserCard
            key={userStat.id}
            user={userStat}
            isCurrentUser={userStat.id === currentUserId}
            onRemoveAdmin={onRemoveAdmin}
            onToggleUserStatus={onToggleUserStatus}
          />
        ))}
      </div>
    </div>
  );
}