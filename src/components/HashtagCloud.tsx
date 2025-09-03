import { Hash, X } from 'lucide-react';

interface HashtagData {
  hashtag: string;
  count: number;
  notes: any[];
}

interface HashtagCloudProps {
  hashtags: HashtagData[];
  selectedHashtag: string | null;
  onHashtagSelect: (hashtag: string | null) => void;
}

export function HashtagCloud({ hashtags, selectedHashtag, onHashtagSelect }: HashtagCloudProps) {
  // Colores para los hashtags basados en frecuencia
  const getHashtagColor = (count: number, maxCount: number) => {
    const intensity = Math.min(count / maxCount, 1);
    
    if (intensity > 0.7) return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700';
    if (intensity > 0.4) return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700';
    if (intensity > 0.2) return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-700';
    return 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600';
  };

  const maxCount = Math.max(...hashtags.map(h => h.count), 1);

  if (hashtags.length === 0) {
    return (
      <div className="text-center py-6 text-app-secondary">
        <Hash className="w-6 h-6 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No hay hashtags</p>
        <p className="text-xs mt-1">Usa #hashtag en tus notas</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header con filtro activo */}
      {selectedHashtag && (
        <div className="flex items-center justify-between p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-700">
          <div className="flex items-center gap-2">
            <Hash className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
              #{selectedHashtag}
            </span>
          </div>
          <button
            onClick={() => onHashtagSelect(null)}
            className="p-1 rounded hover:bg-blue-100 dark:hover:bg-blue-800/50 transition-colors"
          >
            <X className="w-3 h-3 text-blue-600" />
          </button>
        </div>
      )}

      {/* Nube de hashtags */}
      <div className="flex flex-wrap gap-2">
        {hashtags.map(({ hashtag, count }) => (
          <button
            key={hashtag}
            onClick={() => onHashtagSelect(selectedHashtag === hashtag ? null : hashtag)}
            className={`
              inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border transition-all duration-200 hover:scale-105
              ${selectedHashtag === hashtag
                ? 'bg-blue-500 text-white border-blue-500 shadow-md'
                : `${getHashtagColor(count, maxCount)} hover:shadow-sm`
              }
            `}
            title={`${count} nota${count > 1 ? 's' : ''} con #${hashtag}`}
          >
            <Hash className="w-3 h-3" />
            <span>{hashtag}</span>
            <span className={`
              text-xs px-1 rounded-full
              ${selectedHashtag === hashtag
                ? 'bg-white/20 text-white'
                : 'bg-black/10 dark:bg-white/10'
              }
            `}>
              {count}
            </span>
          </button>
        ))}
      </div>

      {/* Estadísticas */}
      <div className="text-xs text-app-tertiary pt-2 border-t border-app">
        {hashtags.length} hashtag{hashtags.length !== 1 ? 's' : ''} encontrado{hashtags.length !== 1 ? 's' : ''}
      </div>
    </div>
  );
}