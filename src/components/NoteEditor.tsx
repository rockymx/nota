import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  hiddenPromptIds: Set<string>;
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

  // Memoizar prompts visibles para evitar recálculos
  const visiblePrompts = useMemo(() => {
    return aiPrompts.filter(prompt => 
      !prompt.isDefault || !hiddenPromptIds.has(prompt.id)
    );
  }, [aiPrompts, hiddenPromptIds]);
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
  const handleSave = useCallback(() => {
    if (title.trim() || content.trim()) {
      onSave(title.trim() || 'Sin título', content, selectedFolderId);
      onClose();
    }
  }, [title, content, selectedFolderId, onSave, onClose]);

  // Función para ejecutar prompt de IA seleccionado
  const handleExecutePrompt = useCallback(async (prompt: AIPrompt) => {
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
  }, [content]);

  // Manejar atajos de teclado (Ctrl+S para guardar)
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.ctrlKey && e.key === 's') {
      e.preventDefault();
      handleSave();
    }
  }, [handleSave]);

  return (
    <div className="flex flex-col h-full bg-app transition-colors duration-300">
      {/* Encabezado con título, selector de carpeta y botones */}
      <div className="flex items-center justify-between p-4 border-b border-app">
        <div className="flex items-center gap-4 flex-1">
          {/* Campo de título */}
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Título de la nota..."
            className="text-lg font-semibold bg-transparent border-none outline-none flex-1 text-app-primary placeholder-app-tertiary"
            onKeyDown={handleKeyDown}
          />
          {/* Selector de carpeta */}
          <select
            value={selectedFolderId || ''}
            onChange={(e) => setSelectedFolderId(e.target.value || null)}
            className="text-sm border border-app rounded-lg px-3 py-1 bg-app text-app-primary"
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
              prompts={visiblePrompts}
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
            className="p-2 rounded-lg hover:bg-app-secondary transition-colors"
          >
            <X className="w-5 h-5 text-app-secondary" />
          </button>
        </div>
      </div>

      {/* Toggle para vista previa */}
      <div className="px-4 py-2 border-b border-app bg-app-secondary">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowPreview(false)}
            className={`px-3 py-1 text-sm rounded-lg transition-colors ${
              !showPreview 
                ? 'bg-app text-app-primary shadow-app-sm' 
                : 'text-app-secondary hover:text-app-primary'
            }`}
          >
            Editar
          </button>
          <button
            onClick={() => setShowPreview(true)}
            className={`px-3 py-1 text-sm rounded-lg transition-colors ${
              showPreview 
                ? 'bg-app text-app-primary shadow-app-sm' 
                : 'text-app-secondary hover:text-app-primary'
            }`}
          >
            Vista previa
          </button>
          <div className="text-xs text-app-tertiary">
            Usa **texto** para negritas, *texto* para cursivas
          </div>
        </div>
      </div>
      {/* Área de edición de texto */}
      <div className="flex-1 p-4">
        {/* Mostrar error de IA si existe */}
        {aiError && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg">
            <p className="text-sm text-red-700 dark:text-red-300">{aiError}</p>
            <button
              onClick={() => setAiError('')}
              className="text-xs text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 mt-1"
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
              <p className="text-app-tertiary italic">Escribe contenido para ver la vista previa...</p>
            )}
          </div>
        ) : (
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Escribe tu nota aquí...&#10;&#10;Usa **texto** para negritas&#10;Usa *texto* para cursivas&#10;Usa # para títulos&#10;Usa - para listas"
            className="w-full h-full resize-none border-none outline-none text-app-primary placeholder-app-tertiary leading-relaxed bg-transparent"
            onKeyDown={handleKeyDown}
          />
        )}
      </div>

      {/* Pie con información de ayuda */}
      <div className="p-4 border-t border-app bg-app-secondary">
        <div className="flex items-center justify-between text-xs text-app-tertiary">
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