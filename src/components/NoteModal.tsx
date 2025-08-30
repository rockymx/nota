import React from 'react';
import { X, Edit3, Calendar, Folder } from 'lucide-react';
import { Note, Folder as FolderType } from '../types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { MarkdownRenderer } from './MarkdownRenderer';

interface NoteModalProps {
  note: Note;
  folders: FolderType[];
  onClose: () => void;
  onEdit: (note: Note) => void;
}

export function NoteModal({ note, folders, onClose, onEdit }: NoteModalProps) {
  const folder = folders.find(f => f.id === note.folderId);

  const handleEdit = () => {
    onEdit(note);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 md:p-4">
      <div className="bg-white rounded-xl md:rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] md:max-h-[90vh] overflow-hidden 
                      fixed md:relative inset-0 md:inset-auto h-full md:h-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 flex-1 pr-4">
            {note.title}
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handleEdit}
              className="p-2 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors"
              title="Editar nota"
            >
              <Edit3 className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 md:p-6 overflow-y-auto flex-1 md:max-h-[60vh]">
          {note.content ? (
            <MarkdownRenderer content={note.content} />
          ) : (
            <p className="text-gray-500 italic">Esta nota no tiene contenido...</p>
          )}
        </div>

        {/* Footer with metadata */}
        <div className="p-4 md:p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center gap-4">
              {folder && (
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: folder.color }}
                  />
                  <Folder className="w-4 h-4" />
                  <span>{folder.name}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>
                  Creada: {format(new Date(note.createdAt), 'dd MMM yyyy', { locale: es })}
                </span>
              </div>
            </div>
            {note.updatedAt && new Date(note.updatedAt).getTime() !== new Date(note.createdAt).getTime() && (
              <span className="text-xs">
                Modificada: {format(new Date(note.updatedAt), 'dd MMM yyyy', { locale: es })}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}