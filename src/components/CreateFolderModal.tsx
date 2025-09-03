import React, { useState } from 'react';
import { X, Folder } from 'lucide-react';

interface CreateFolderModalProps {
  onClose: () => void;
  onCreateFolder: (name: string, color: string) => void;
}

const FOLDER_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Yellow
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#06B6D4', // Cyan
  '#F97316', // Orange
  '#84CC16', // Lime
];

export function CreateFolderModal({ onClose, onCreateFolder }: CreateFolderModalProps) {
  const [name, setName] = useState('');
  const [selectedColor, setSelectedColor] = useState(FOLDER_COLORS[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submit:', { name: name.trim(), color: selectedColor });
    
    if (name.trim()) {
      console.log('📝 Calling onCreateFolder with:', { name: name.trim(), color: selectedColor });
      onCreateFolder(name.trim(), selectedColor);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-app rounded-xl shadow-app-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-app">
          <h2 className="text-lg font-semibold text-app-primary">Nueva Carpeta</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-app-secondary transition-colors"
          >
            <X className="w-5 h-5 text-app-secondary" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-app-primary mb-2">
              Nombre de la carpeta
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Trabajo, Personal, Ideas..."
              className="w-full px-3 py-2 border border-app rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors bg-app text-app-primary placeholder-app-tertiary"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-app-primary mb-3">
              Color de la carpeta
            </label>
            <div className="grid grid-cols-4 gap-3">
              {FOLDER_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  className={`w-12 h-12 rounded-lg flex items-center justify-center transition-all ${
                    selectedColor === color
                      ? 'ring-2 ring-offset-2 ring-blue-400 scale-110'
                      : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: color }}
                >
                  <Folder className="w-6 h-6 text-white" />
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 btn-secondary"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Crear Carpeta
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}