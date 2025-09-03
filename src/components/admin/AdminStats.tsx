import { Users, FileText, Folder, Sparkles, Activity, UserPlus } from 'lucide-react';
import { DashboardStats } from '../../types/admin';

interface AdminStatsProps {
  stats: DashboardStats;
}

export function AdminStats({ stats }: AdminStatsProps) {
  const statCards = [
    {
      title: 'Total Usuarios',
      value: stats.totalUsers,
      icon: Users,
      color: 'blue',
      description: `${stats.newUsersThisMonth} nuevos este mes`
    },
    {
      title: 'Usuarios Activos',
      value: stats.activeUsers,
      icon: Activity,
      color: 'green',
      description: 'Últimos 30 días'
    },
    {
      title: 'Total Notas',
      value: stats.totalNotes,
      icon: FileText,
      color: 'purple',
      description: 'En toda la plataforma'
    },
    {
      title: 'Total Carpetas',
      value: stats.totalFolders,
      icon: Folder,
      color: 'yellow',
      description: 'Organizadas por usuarios'
    },
    {
      title: 'Prompts Personalizados',
      value: stats.totalPrompts,
      icon: Sparkles,
      color: 'pink',
      description: 'Creados por usuarios'
    },
  ];

  const getColorClasses = (color: string) => {
    const colors = {
      blue: 'bg-blue-50 border-blue-200 text-blue-700',
      green: 'bg-green-50 border-green-200 text-green-700',
      purple: 'bg-purple-50 border-purple-200 text-purple-700',
      yellow: 'bg-yellow-50 border-yellow-200 text-yellow-700',
      pink: 'bg-pink-50 border-pink-200 text-pink-700',
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  const getIconColorClasses = (color: string) => {
    const colors = {
      blue: 'text-blue-600',
      green: 'text-green-600',
      purple: 'text-purple-600',
      yellow: 'text-yellow-600',
      pink: 'text-pink-600',
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  return (
    <div>
      <h2 className="text-lg font-semibold text-app-primary mb-4">Estadísticas del Sistema</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.title}
              className={`rounded-lg border p-4 ${getColorClasses(stat.color)} dark:bg-opacity-20 dark:border-opacity-30`}
            >
              <div className="flex items-center justify-between mb-2">
                <Icon className={`w-5 h-5 ${getIconColorClasses(stat.color)}`} />
              </div>
              <div>
                <p className="text-2xl font-bold mb-1">{stat.value.toLocaleString()}</p>
                <p className="text-sm font-medium mb-1">{stat.title}</p>
                <p className="text-xs opacity-75">{stat.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}