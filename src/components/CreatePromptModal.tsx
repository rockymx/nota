import React, { useState } from 'react';
import { X, Sparkles, Save } from 'lucide-react';
import { AIPrompt } from '../types';
import { useFormValidation } from '../hooks/useFormValidation';
import { entitySchemas } from '../lib/validation';
import { ValidatedInput } from './forms/ValidatedInput';
import { ValidatedTextarea } from './forms/ValidatedTextarea';

interface CreatePromptModalProps {
  onClose: () => void;
  onCreatePrompt: (name: string, description: string, promptTemplate: string, category: string) => Promise<AIPrompt | null>;
  editingPrompt?: AIPrompt | null;
}

const CATEGORIES = [
  { value: 'escritura', label: 'Escritura' },
  { value: 'resumen', label: 'Resumen' },
  { value: 'edicion', label: 'Edición' },
  { value: 'expansion', label: 'Expansión' },
  { value: 'formato', label: 'Formato' },
  { value: 'custom', label: 'Personalizado' },
];

export function CreatePromptModal({ onClose, onCreatePrompt, editingPrompt }: CreatePromptModalProps) {
  const {
    fields,
    formState,
    getFieldProps,
    validateForm,
    setFieldValue,
  } = useFormValidation(entitySchemas.aiPrompt, {
    name: editingPrompt?.name || '',
    description: editingPrompt?.description || '',
    promptTemplate: editingPrompt?.promptTemplate || '',
    category: editingPrompt?.category || 'custom',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = validateForm();
    if (!validation.valid) {
      console.log('❌ Prompt form validation failed:', validation.errors);
      return;
    }

    console.log('✅ Prompt form validation passed:', validation.data);
    setIsSubmitting(true);
    
    try {
      const data = validation.data!;
      await onCreatePrompt(data.name, data.description, data.promptTemplate, data.category);
      onClose();
    } catch (error) {
      console.error('Error creating prompt:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-app rounded-xl shadow-app-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-app">
          <div className="flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-purple-600" />
            <h2 className="text-lg font-semibold text-app-primary">
              {editingPrompt ? 'Editar Prompt' : 'Crear Nuevo Prompt'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-app-secondary transition-colors"
          >
            <X className="w-5 h-5 text-app-secondary" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <ValidatedInput
                {...getFieldProps('name')}
                label="Nombre del prompt"
                placeholder="Ej: Mejorar gramática"
                required
                showValidIcon
                helperText="Entre 3 y 100 caracteres"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-app-primary mb-2">
                Categoría
              </label>
              <select
                value={fields.category?.value || 'custom'}
                onChange={(e) => setFieldValue('category', e.target.value)}
                className="w-full px-3 py-2 border border-app rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-colors bg-app text-app-primary"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <ValidatedInput
              {...getFieldProps('description')}
              label="Descripción"
              placeholder="Describe qué hace este prompt..."
              required
              showValidIcon
              helperText="Entre 10 y 500 caracteres"
            />
          </div>

          <div>
            <ValidatedTextarea
              {...getFieldProps('promptTemplate')}
              label="Plantilla del prompt"
              placeholder="Escribe tu prompt aquí. Usa {content} donde quieras insertar el contenido de la nota..."
              rows={8}
              required
              showValidIcon
              showCharCount
              maxLength={5000}
              helperText="Debe incluir {content} y puede usar {title}, {tags}"
            />
          </div>

          <div className="flex gap-3 pt-4 border-t border-app">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-app text-app-primary rounded-lg hover:bg-app-secondary transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!formState.isValid || isSubmitting}
              className="flex-1 bg-purple-500 hover:bg-purple-600 disabled:bg-purple-300 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {editingPrompt ? 'Actualizar' : 'Crear Prompt'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}