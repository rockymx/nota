import { Note, Folder as FolderType } from '../types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { MarkdownRenderer } from './MarkdownRenderer';
import { Edit3, Trash2, Calendar } from 'lucide-react';

/**
 * Componente que muestra la lista de notas en formato de tarjetas
 * Incluye información de carpeta, fecha y acciones de editar/eliminar
 */
interface NotesListProps {
  notes: Note[];
  folders: FolderType[];
  onEditNote: (note: Note) => void;
  onDeleteNote: (id: string) => void;
  onViewNote: (note: Note) => void;
}

export function NotesList({ notes, folders, onEditNote, onDeleteNote, onViewNote }: NotesListProps) {
  // Función auxiliar para obtener carpeta por ID
  const getFolderById = (id: string | null) => {
    return folders.find(folder => folder.id === id);
  };

  // Mostrar mensaje cuando no hay notas
  if (notes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
        <Edit3 className="w-16 h-16 mb-4 opacity-50" />
        <h3 className="text-lg font-medium mb-2 dark:text-gray-300">No hay notas</h3>
        <p className="text-sm text-center max-w-sm">
          Comienza creando tu primera nota. Haz clic en el botón "+" para empezar.
        </p>
      </div>
    );
  }

  // Renderizar lista de notas
  return (
    <div className="grid gap-4 p-4">
      {notes.map((note) => {
        const folder = getFolderById(note.folderId);
        
        return (
          <div 
            key={note.id} 
            className="note-card group cursor-pointer"
            onClick={() => onViewNote(note)}
          >
            {/* Encabezado de la tarjeta con título y botones */}
            <div className="flex items-start justify-between mb-3">
              <h3 className="font-semibold text-gray-900 line-clamp-1 flex-1">
                {note.title}
              </h3>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditNote(note);
                  }}
                  className="p-1 rounded hover:bg-gray-100 transition-colors"
                >
                  <Edit3 className="w-4 h-4 text-gray-500" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteNote(note.id);
                  }}
                  className="p-1 rounded hover:bg-red-100 transition-colors"
                >
                  <Trash2 className="w-4 h-4 text-gray-500 hover:text-red-500" />
                </button>
              </div>
            </div>

            {/* Contenido de la nota */}
            <div className="text-gray-600 text-sm mb-4 leading-relaxed line-clamp-3 overflow-hidden">
              {note.content ? (
                <MarkdownRenderer 
                  content={note.content} 
                  className="text-sm [&>*]:mb-1 [&>*:last-child]:mb-0"
                />
              ) : (
                <span className="text-gray-400 italic">Sin contenido...</span>
              )}
            </div>

            {/* Información adicional: carpeta y fecha */}
            <div className="flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center gap-4">
                {/* Mostrar carpeta si existe */}
                {folder && (
                  <div className="flex items-center gap-1">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: folder.color }}
                    />
                    <span>{folder.name}</span>
                  </div>
                )}
                {/* Fecha de creación */}
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <span>{format(new Date(note.createdAt), 'dd MMM yyyy', { locale: es })}</span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}