import React, { useState, useEffect } from 'react';
import { Save, X } from 'lucide-react';
import { Note, Folder } from '../types';
import { AIPrompt } from '../types';
import { geminiService } from '../services/geminiService';
import { PromptSelector } from './PromptSelector';
import { MarkdownRenderer } from './MarkdownRenderer';

/**
 * Componente para editar y crear notas
 * Incluye editor de texto, selección de carpeta y funciones de IA
 */
interface NoteEditorProps {
  note: Note | null;
  folders: Folder[];
  aiPrompts: AIPrompt[];
  onSave: (title: string, content: string, folderId: string | null) => void;
  onClose: () => void;
}

export function NoteEditor({ note, folders, aiPrompts, hiddenPromptIds, onSave, onClose }: NoteEditorProps) {
  // Estados del editor
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  // Cargar datos de la nota cuando cambia
  useEffect(() => {
    if (note) {
      // Editar nota existente
      setTitle(note.title);
      setContent(note.content);
      setSelectedFolderId(note.folderId);
    } else {
      // Nueva nota
      setTitle('');
      setContent('');
      setSelectedFolderId(null);
    }
  }, [note]);

  // Función para guardar la nota
  const handleSave = () => {
    if (title.trim() || content.trim()) {
      onSave(title.trim() || 'Sin título', content, selectedFolderId);
      onClose();
    }
  };

  // Función para ejecutar prompt de IA seleccionado
  const handleExecutePrompt = async (prompt: AIPrompt) => {
    if (!content.trim()) {
      setAiError('Escribe algo de contenido primero');
      return;
    }

    if (!geminiService.isConfigured()) {
      setAiError('Configura tu API key de Gemini primero');
      return;
    }

    setAiLoading(true);
    setAiError('');

    try {
      // Usar executePrompt para prompts personalizados y las funciones específicas para los por defecto
      let improvedContent: string;
      
      if (prompt.isDefault) {
        // Para prompts por defecto, usar las funciones específicas
        switch (prompt.name) {
          case 'Mejorar escritura':
            improvedContent = await geminiService.improveNote(content);
            break;
          case 'Crear resumen':
            improvedContent = await geminiService.generateSummary(content);
            break;
          default:
            improvedContent = await geminiService.executePrompt(prompt.promptTemplate, content);
        }
      } else {
        // Para prompts personalizados, usar executePrompt
        improvedContent = await geminiService.executePrompt(prompt.promptTemplate, content);
      }
      
      setContent(improvedContent);
    } catch (error) {
      setAiError(error instanceof Error ? error.message : 'Error mejorando la nota');
    } finally {
      setAiLoading(false);
    }
  };

  // Manejar atajos de teclado (Ctrl+S para guardar)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.ctrlKey && e.key === 's') {
      e.preventDefault();
      handleSave();
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800">
      {/* Encabezado con título, selector de carpeta y botones */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-4 flex-1">
          {/* Campo de título */}
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Título de la nota..."
            className="text-lg font-semibold bg-transparent border-none outline-none flex-1 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
            onKeyDown={handleKeyDown}
          />
          {/* Selector de carpeta */}
          <select
            value={selectedFolderId || ''}
            onChange={(e) => setSelectedFolderId(e.target.value || null)}
            className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1 bg-white dark:bg-gray-700 dark:text-gray-200"
          >
            <option value="">Sin carpeta</option>
            {folders.map((folder) => (
              <option key={folder.id} value={folder.id}>
                {folder.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          {/* Botón de IA (pendiente de implementar) */}
          <div className="flex items-center gap-1">
            <PromptSelector
              prompts={aiPrompts.filter(prompt => 
                !prompt.isDefault || !hiddenPromptIds.has(prompt.id)
              )}
              onSelectPrompt={handleExecutePrompt}
              loading={aiLoading}
              disabled={!content.trim()}
            />
          </div>
          {/* Botón de guardar */}
          <button
            onClick={handleSave}
            className="btn-primary"
          >
            <Save className="w-4 h-4 mr-2" />
            Guardar
          </button>
          {/* Botón de cerrar */}
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Toggle para vista previa */}
      <div className="px-4 py-2 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowPreview(false)}
            className={`px-3 py-1 text-sm rounded-lg transition-colors ${
              !showPreview 
                ? 'bg-white text-gray-900 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Editar
          </button>
          <button
            onClick={() => setShowPreview(true)}
            className={`px-3 py-1 text-sm rounded-lg transition-colors ${
              showPreview 
                ? 'bg-white text-gray-900 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Vista previa
          </button>
          <div className="text-xs text-gray-500">
            Usa **texto** para negritas, *texto* para cursivas
          </div>
        </div>
      </div>
      {/* Área de edición de texto */}
      <div className="flex-1 p-4">
        {/* Mostrar error de IA si existe */}
        {aiError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">{aiError}</p>
            <button
              onClick={() => setAiError('')}
              className="text-xs text-red-500 hover:text-red-700 mt-1"
            >
              Cerrar
            </button>
          </div>
        )}
        
        {showPreview ? (
          <div className="h-full overflow-y-auto">
            {content ? (
              <MarkdownRenderer content={content} />
            ) : (
              <p className="text-gray-400 italic">Escribe contenido para ver la vista previa...</p>
            )}
          </div>
        ) : (
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Escribe tu nota aquí...&#10;&#10;Usa **texto** para negritas&#10;Usa *texto* para cursivas&#10;Usa # para títulos&#10;Usa - para listas"
            className="w-full h-full resize-none border-none outline-none text-gray-700 placeholder-gray-400 leading-relaxed"
            onKeyDown={handleKeyDown}
          />
        )}
      </div>

      {/* Pie con información de ayuda */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Presiona Ctrl+S para guardar rápidamente</span>
          {geminiService.isConfigured() && (
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              IA configurada
            </span>
          )}
        </div>
      </div>
    </div>
  );
}