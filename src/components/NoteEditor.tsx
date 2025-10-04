import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Save, X } from 'lucide-react';
import { Note, Folder } from '../types';
import { AIPrompt } from '../types';
import { geminiService } from '../services/geminiService';
import { PromptSelector } from './PromptSelector';
import { MarkdownRenderer } from './MarkdownRenderer';
import { useFormValidation } from '../hooks/useFormValidation';
import { entitySchemas, customValidators, VALIDATION_LIMITS } from '../lib/validation';
import { ValidatedInput } from './forms/ValidatedInput';
import { ValidatedTextarea } from './forms/ValidatedTextarea';

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
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  const {
    fields,
    formState,
    getFieldProps,
    validateForm,
    setFieldValue,
    resetForm,
  } = useFormValidation(entitySchemas.note, {
    title: '',
    content: '',
    folderId: null,
  });
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
      resetForm({
        title: note.title,
        content: note.content,
        folderId: note.folderId,
      });
      setSelectedFolderId(note.folderId);
    } else {
      // Nueva nota
      resetForm({
        title: '',
        content: '',
        folderId: null,
      });
      setSelectedFolderId(null);
    }
  }, [note, resetForm]);

  // Función para guardar la nota
  const handleSave = useCallback(() => {
    const validation = validateForm();
    if (!validation.valid) {
      console.log('❌ Note validation failed:', validation.errors);
      return;
    }

    const data = validation.data!;
    if (data.title.trim() || data.content.trim()) {
      onSave(data.title || 'Sin título', data.content, selectedFolderId);
      onClose();
    }
  }, [validateForm, selectedFolderId, onSave, onClose]);

  // Función para ejecutar prompt de IA seleccionado
  const handleExecutePrompt = useCallback(async (prompt: AIPrompt) => {
    const currentContent = fields.content?.value || '';
    
    // Validar contenido para IA
    const aiValidation = customValidators.validateNoteForAI(currentContent);
    if (!aiValidation.valid) {
      setAiError(aiValidation.errors[0]);
      return;
    }

    if (!currentContent.trim()) {
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
      let improvedContent: string = '';

      if (prompt.isDefault) {
        // Para prompts por defecto, usar las funciones específicas
        switch (prompt.name) {
          case 'Mejorar escritura':
            improvedContent = await geminiService.improveNote(currentContent);
            break;
          case 'Crear resumen':
            improvedContent = await geminiService.generateSummary(currentContent);
            break;
          default:
            improvedContent = await geminiService.executePrompt(prompt.promptTemplate, currentContent);
        }
      } else {
        // Para prompts personalizados, usar executePrompt
        improvedContent = await geminiService.executePrompt(prompt.promptTemplate, currentContent);
      }

      // Solo actualizar si hay contenido mejorado
      if (improvedContent && improvedContent.trim().length > 0) {
        setFieldValue('content', improvedContent);
      } else {
        setAiError('No se pudo generar contenido mejorado');
      }
    } catch (error) {
      setAiError(error instanceof Error ? error.message : 'Error mejorando la nota');
    } finally {
      setAiLoading(false);
    }
  }, [fields.content?.value, setFieldValue]);

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
          <ValidatedInput
            {...getFieldProps('title')}
            placeholder="Título de la nota..."
            className="text-lg font-semibold bg-transparent border-none outline-none flex-1 text-app-primary placeholder-app-tertiary focus:ring-0 focus:border-none"
            maxLength={VALIDATION_LIMITS.NOTE_TITLE_MAX}
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
              disabled={!fields.content?.value?.trim()}
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
            {fields.content?.value ? (
              <MarkdownRenderer content={fields.content.value} />
            ) : (
              <p className="text-app-tertiary italic">Escribe contenido para ver la vista previa...</p>
            )}
          </div>
        ) : (
          <ValidatedTextarea
            {...getFieldProps('content')}
            placeholder="Escribe tu nota aquí...&#10;&#10;Usa **texto** para negritas&#10;Usa *texto* para cursivas&#10;Usa # para títulos&#10;Usa - para listas"
            className="w-full h-full resize-none border-none outline-none text-app-primary placeholder-app-tertiary leading-relaxed bg-transparent focus:ring-0 focus:border-none"
            showCharCount
            maxLength={VALIDATION_LIMITS.NOTE_CONTENT_MAX}
          />
        )}
      </div>

      {/* Pie con información de ayuda */}
      <div className="p-4 border-t border-app bg-app-secondary">
        <div className="flex items-center justify-between text-xs text-app-tertiary">
          <div className="flex items-center gap-4">
            <span>Presiona Ctrl+S para guardar rápidamente</span>
            {!formState.isValid && formState.hasValues && (
              <span className="text-red-500">⚠ Revisa los errores del formulario</span>
            )}
          </div>
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