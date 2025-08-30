import React, { useState } from 'react';
import { X, Sparkles, Save } from 'lucide-react';
import { AIPrompt } from '../types';

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
  const [name, setName] = useState(editingPrompt?.name || '');
  const [description, setDescription] = useState(editingPrompt?.description || '');
  const [promptTemplate, setPromptTemplate] = useState(editingPrompt?.promptTemplate || '');
  const [category, setCategory] = useState(editingPrompt?.category || 'custom');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !description.trim() || !promptTemplate.trim()) {
      return;
    }

    setLoading(true);
    try {
      await onCreatePrompt(name.trim(), description.trim(), promptTemplate.trim(), category);
      onClose();
    } catch (error) {
      console.error('Error creating prompt:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-purple-600" />
            <h2 className="text-lg font-semibold text-gray-900">
              {editingPrompt ? 'Editar Prompt' : 'Crear Nuevo Prompt'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre del prompt
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Mejorar gramática"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-colors"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categoría
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-colors"
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descripción
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe qué hace este prompt..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-colors"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Plantilla del prompt
            </label>
            <textarea
              value={promptTemplate}
              onChange={(e) => setPromptTemplate(e.target.value)}
              placeholder="Escribe tu prompt aquí. Usa {content} donde quieras insertar el contenido de la nota..."
              rows={8}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-colors resize-none"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              💡 Tip: Usa <code className="bg-gray-100 px-1 rounded">{'{content}'}</code> para insertar el contenido de la nota
            </p>
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim() || !description.trim() || !promptTemplate.trim()}
              className="flex-1 bg-purple-500 hover:bg-purple-600 disabled:bg-purple-300 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
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