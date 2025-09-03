import React from 'react';
import { X, Trash2, AlertTriangle } from 'lucide-react';
import { Folder } from '../types';

interface DeleteFolderModalProps {
  folder: Folder;
  notesCount: number;
  onClose: () => void;
  onConfirm: () => void;
}

export function DeleteFolderModal({ folder, notesCount, onClose, onConfirm }: DeleteFolderModalProps) {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-app rounded-xl shadow-app-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-app">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <h2 className="text-lg font-semibold text-app-primary">Eliminar Carpeta</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-app-secondary transition-colors"
          >
            <X className="w-5 h-5 text-app-secondary" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg">
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: folder.color }}
            >
              <Trash2 className="w-3 h-3 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-red-900 dark:text-red-300">
                ¿Estás seguro de eliminar la carpeta "{folder.name}"?
              </p>
              {notesCount > 0 && (
                <p className="text-xs text-red-700 dark:text-red-400 mt-1">
                  {notesCount} nota{notesCount > 1 ? 's' : ''} se moverá{notesCount > 1 ? 'n' : ''} a "Sin carpeta"
                </p>
              )}
            </div>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 rounded-lg p-3">
            <p className="text-sm text-yellow-800 dark:text-yellow-300">
              <strong>Importante:</strong> Esta acción no se puede deshacer. Las notas no se eliminarán, solo se moverán fuera de la carpeta.
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-app text-app-primary rounded-lg hover:bg-app-secondary transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="flex-1 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Eliminar Carpeta
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}