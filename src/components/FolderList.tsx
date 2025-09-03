import { useState } from 'react';
import { Folder, Trash2, Hash } from 'lucide-react';
import { Folder as FolderType } from '../types';
import { DeleteFolderModal } from './DeleteFolderModal';

interface FolderListProps {
  folders: FolderType[];
  notes: any[];
  selectedFolderId: string | null;
  onFolderSelect: (folderId: string | null) => void;
  onDeleteFolder: (id: string) => void;
}

export function FolderList({
  folders,
  notes,
  selectedFolderId,
  onFolderSelect,
  onDeleteFolder,
}: FolderListProps) {
  const [folderToDelete, setFolderToDelete] = useState<FolderType | null>(null);

  const handleDeleteClick = (folder: FolderType) => {
    setFolderToDelete(folder);
  };

  const handleConfirmDelete = () => {
    if (folderToDelete) {
      onDeleteFolder(folderToDelete.id);
      setFolderToDelete(null);
    }
  };

  const getNotesCountInFolder = (folderId: string) => {
    return notes.filter(note => note.folderId === folderId).length;
  };

  return (
    <>
      <div className="space-y-2">
      {/* All Notes */}
      <button
        onClick={() => onFolderSelect(null)}
        className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left ${
          selectedFolderId === null
            ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700'
            : 'hover:bg-app-secondary text-app-primary'
        }`}
      >
        <Hash className="w-5 h-5" />
        <span className="text-sm font-medium">Todas las notas</span>
      </button>

      {/* Folders */}
      {folders.map((folder) => (
        <div
          key={folder.id}
          className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
            selectedFolderId === folder.id
              ? 'bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700'
              : 'hover:bg-app-secondary'
          }`}
        >
          <button
            onClick={() => onFolderSelect(folder.id)}
            className="flex-1 flex items-center gap-3 text-left"
          >
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center"
              style={{ backgroundColor: folder.color }}
            >
              <Folder className="w-3 h-3 text-white" />
            </div>
            <span className={`text-sm font-medium ${
              selectedFolderId === folder.id ? 'text-blue-700 dark:text-blue-300' : 'text-app-primary'
            }`}>
              {folder.name}
            </span>
          </button>
          <button
            onClick={() => handleDeleteClick(folder)}
            className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors group"
          >
            <Trash2 className="w-4 h-4 text-app-tertiary group-hover:text-red-500" />
          </button>
        </div>
      ))}

      {folders.length === 0 && (
        <div className="text-center py-8 text-app-secondary">
          <Folder className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No hay carpetas creadas</p>
        </div>
      )}
      </div>

      {/* Modal de confirmación para eliminar carpeta */}
      {folderToDelete && (
        <DeleteFolderModal
          folder={folderToDelete}
          notesCount={getNotesCountInFolder(folderToDelete.id)}
          onClose={() => setFolderToDelete(null)}
          onConfirm={handleConfirmDelete}
        />
      )}
    </>
  );
}