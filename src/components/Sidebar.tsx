import { useState } from 'react';
import { X, Plus, Calendar, Folder, Settings } from 'lucide-react';
import { FolderList } from './FolderList';
import { CalendarView } from './CalendarView';
import { CreateFolderModal } from './CreateFolderModal';
import { User } from '@supabase/supabase-js';
import { Folder as FolderType } from '../types';

/**
 * Componente de barra lateral
 * Contiene navegación entre carpetas, calendario y configuración
 */
interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  user: User | null;
  folders: FolderType[];
  selectedFolderId: string | null;
  selectedDate: Date | null;
  onFolderSelect: (folderId: string | null) => void;
  onDateSelect: (date: Date | null) => void;
  onCreateFolder: (name: string, color: string) => Promise<FolderType | null>;
  onDeleteFolder: (id: string) => void;
  onShowSettings: () => void;
}

export function Sidebar({
  isOpen,
  onToggle,
  user,
  folders,
  selectedFolderId,
  selectedDate,
  onFolderSelect,
  onDateSelect,
  onCreateFolder,
  onDeleteFolder,
  onShowSettings,
}: SidebarProps) {
  // Estados para controlar la vista activa y modales
  const [activeView, setActiveView] = useState<'folders' | 'calendar'>('folders');
  const [showCreateFolder, setShowCreateFolder] = useState(false);

  // Función para crear carpeta con manejo de errores
  const handleCreateFolder = async (name: string, color: string) => {
    try {
      await onCreateFolder(name, color);
    } catch (error) {
      console.error('Error creating folder:', error);
    }
  };

  return (
    <>
      {/* Overlay para cerrar sidebar en móvil */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Contenedor principal del sidebar */}
      <div className={`
        fixed top-0 left-0 h-full w-80 bg-white dark:bg-gray-800 shadow-xl z-50 
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:relative lg:translate-x-0 lg:shadow-none lg:border-r lg:border-gray-200 dark:lg:border-gray-700
      `}>
        {/* Navegación entre vistas (Carpetas/Calendario) */}
        <div className="p-4 relative">
          {/* Botón de cerrar para móvil */}
          <button
            onClick={onToggle}
            className="absolute top-2 right-2 p-2 rounded-lg hover:bg-gray-100 transition-colors lg:hidden z-10"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex bg-gray-100 rounded-lg p-1 mb-4">
            <button
              onClick={() => setActiveView('folders')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                activeView === 'folders'
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Folder className="w-4 h-4" />
              Carpetas
            </button>
            <button
              onClick={() => setActiveView('calendar')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                activeView === 'calendar'
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Calendar className="w-4 h-4" />
              Calendario
            </button>
          </div>

          {/* Contenido según la vista activa */}
          <div className="space-y-4">
            {activeView === 'folders' && (
              <>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-gray-700">Organizar por carpetas</h3>
                  <button
                    onClick={() => setShowCreateFolder(true)}
                    className="p-1 rounded hover:bg-gray-100 transition-colors"
                  >
                    <Plus className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
                <FolderList
                  folders={folders}
                  selectedFolderId={selectedFolderId}
                  onFolderSelect={onFolderSelect}
                  onDeleteFolder={onDeleteFolder}
                />
              </>
            )}

            {activeView === 'calendar' && (
              <>
                <h3 className="text-sm font-medium text-gray-700">Filtrar por fecha</h3>
                <CalendarView
                  selectedDate={selectedDate}
                  onDateSelect={onDateSelect}
                />
              </>
            )}
          </div>
        </div>

        {/* Pie con configuración de IA */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <button
            onClick={onShowSettings}
            className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <Settings className="w-5 h-5 text-gray-500" />
              <span className="text-sm text-gray-700">Configuración</span>
            </div>
          </button>
        </div>
      </div>

      {/* Modales para crear carpeta y configurar IA */}
      {showCreateFolder && (
        <CreateFolderModal
          onClose={() => setShowCreateFolder(false)}
          onCreateFolder={handleCreateFolder}
        />
      )}
    </>
  );
}