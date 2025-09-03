import { X, Edit3, Calendar, Folder } from 'lucide-react';
import { Copy } from 'lucide-react';
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

  const handleCopyContent = async () => {
    try {
      await navigator.clipboard.writeText(note.content);
      // Mostrar feedback visual temporal
      const button = document.querySelector('[data-copy-button]') as HTMLElement;
      if (button) {
        const originalText = button.innerHTML;
        button.innerHTML = '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>';
        setTimeout(() => {
          button.innerHTML = originalText;
        }, 1500);
      }
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      // Fallback para navegadores que no soportan clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = note.content;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
  };
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 md:p-4">
      <div className="bg-app rounded-xl md:rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] md:max-h-[90vh] overflow-hidden 
                      fixed md:relative inset-0 md:inset-auto h-full md:h-auto transition-colors duration-300 border border-app">
        {/* Header */}
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-app">
          <h2 className="text-xl font-semibold text-app-primary flex-1 pr-4">
            {note.title}
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyContent}
              data-copy-button
              className="p-2 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/30 text-green-600 dark:text-green-400 transition-colors"
              title="Copiar contenido"
            >
              <Copy className="w-5 h-5" />
            </button>
            <button
              onClick={handleEdit}
              className="p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 transition-colors"
              title="Editar nota"
            >
              <Edit3 className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-app-secondary transition-colors"
            >
              <X className="w-5 h-5 text-app-secondary" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 md:p-6 overflow-y-auto flex-1 md:max-h-[60vh]">
          {note.content ? (
            <MarkdownRenderer content={note.content} />
          ) : (
            <p className="text-app-tertiary italic">Esta nota no tiene contenido...</p>
          )}
        </div>

        {/* Footer with metadata */}
        <div className="p-4 md:p-6 border-t border-app bg-app-secondary">
          <div className="flex items-center justify-between text-sm text-app-secondary">
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