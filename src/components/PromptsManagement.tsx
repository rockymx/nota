import { useState } from 'react';
import { Plus, Edit3, Trash2, Sparkles, Tag } from 'lucide-react';
import { AIPrompt } from '../types';
import { CreatePromptModal } from './CreatePromptModal';

interface PromptsManagementProps {
  prompts: AIPrompt[];
  hiddenPromptIds: Set<string>;
  onCreatePrompt: (name: string, description: string, promptTemplate: string, category: string) => Promise<AIPrompt | null>;
  onUpdatePrompt: (id: string, updates: Partial<Pick<AIPrompt, 'name' | 'description' | 'promptTemplate' | 'category'>>) => Promise<void>;
  onDeletePrompt: (id: string) => Promise<void>;
  onHideDefaultPrompt: (promptId: string) => Promise<void>;
  onShowDefaultPrompt: (promptId: string) => Promise<void>;
}

export function PromptsManagement({ 
  prompts, 
  hiddenPromptIds,
  onCreatePrompt, 
  onUpdatePrompt, 
  onDeletePrompt,
  onHideDefaultPrompt,
  onShowDefaultPrompt
}: PromptsManagementProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<AIPrompt | null>(null);

  // Separar prompts por defecto y personalizados
  const defaultPrompts = prompts.filter(p => p.isDefault);
  const customPrompts = prompts.filter(p => !p.isDefault);

  const handleEditPrompt = (prompt: AIPrompt) => {
    setEditingPrompt(prompt);
    setShowCreateModal(true);
  };

  const handleCreateOrUpdate = async (name: string, description: string, promptTemplate: string, category: string): Promise<AIPrompt | null> => {
    if (editingPrompt) {
      await onUpdatePrompt(editingPrompt.id, { name, description, promptTemplate, category });
      return null;
    } else {
      return await onCreatePrompt(name, description, promptTemplate, category);
    }
    setEditingPrompt(null);
  };

  const handleCloseModal = () => {
    setShowCreateModal(false);
    setEditingPrompt(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Prompts de IA</h3>
          <p className="text-sm text-gray-600">Gestiona tus prompts personalizados para mejorar notas</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Crear Prompt
        </button>
      </div>

      {/* Prompts personalizados */}
      <div>
        <h4 className="text-md font-medium text-gray-900 mb-3 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-600" />
          Mis Prompts ({customPrompts.length})
        </h4>
        
        {customPrompts.length === 0 ? (
          <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <Sparkles className="w-8 h-8 text-gray-400 mx-auto mb-3" />
            <h5 className="text-sm font-medium text-gray-900 mb-1">No tienes prompts personalizados</h5>
            <p className="text-xs text-gray-600 mb-4">Crea tu primer prompt para personalizar las funciones de IA</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="text-sm text-purple-600 hover:text-purple-700 font-medium"
            >
              Crear mi primer prompt
            </button>
          </div>
        ) : (
          <div className="grid gap-3">
            {customPrompts.map(prompt => (
              <div key={prompt.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h5 className="font-medium text-gray-900">{prompt.name}</h5>
                      <span className="inline-flex items-center gap-1 text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                        <Tag className="w-3 h-3" />
                        {prompt.category}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{prompt.description}</p>
                    <p className="text-xs text-gray-500 line-clamp-2 font-mono bg-gray-50 p-2 rounded">
                      {prompt.promptTemplate}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 ml-4">
                    <button
                      onClick={() => handleEditPrompt(prompt)}
                      className="p-2 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors"
                      title="Editar prompt"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDeletePrompt(prompt.id)}
                      className="p-2 rounded-lg hover:bg-red-50 text-red-600 transition-colors"
                      title="Eliminar prompt"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Prompts por defecto */}
      <div>
        <h4 className="text-md font-medium text-gray-900 mb-3 flex items-center gap-2">
          <Tag className="w-4 h-4 text-blue-600" />
          Prompts por Defecto ({defaultPrompts.length})
        </h4>
        
        <div className="grid gap-3">
          {defaultPrompts.map(prompt => (
            <div key={prompt.id} className={`rounded-lg p-4 border transition-colors ${
              hiddenPromptIds.has(prompt.id)
                ? 'bg-gray-50 border-gray-200 opacity-60'
                : 'bg-blue-50 border-blue-200'
            }`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h5 className={`font-medium ${
                      hiddenPromptIds.has(prompt.id) ? 'text-gray-600' : 'text-blue-900'
                    }`}>
                      {prompt.name}
                    </h5>
                    <span className="inline-flex items-center gap-1 text-xs bg-blue-200 text-blue-800 px-2 py-0.5 rounded-full">
                      <Tag className="w-3 h-3" />
                      {prompt.category}
                    </span>
                    {hiddenPromptIds.has(prompt.id) && (
                      <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
                        Oculto
                      </span>
                    )}
                  </div>
                  <p className={`text-sm ${
                    hiddenPromptIds.has(prompt.id) ? 'text-gray-500' : 'text-blue-700'
                  }`}>
                    {prompt.description}
                  </p>
                </div>
                <div className="ml-4">
                  {hiddenPromptIds.has(prompt.id) ? (
                    <button
                      onClick={() => onShowDefaultPrompt(prompt.id)}
                      className="px-3 py-1 text-xs bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                    >
                      Mostrar
                    </button>
                  ) : (
                    <button
                      onClick={() => onHideDefaultPrompt(prompt.id)}
                      className="px-3 py-1 text-xs border border-gray-300 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      Ocultar
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal para crear/editar prompt */}
      {showCreateModal && (
        <CreatePromptModal
          onClose={handleCloseModal}
          onCreatePrompt={handleCreateOrUpdate}
          editingPrompt={editingPrompt}
        />
      )}
    </div>
  );
}