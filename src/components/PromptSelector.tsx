import { useState } from 'react';
import { ChevronDown, Wand2, Sparkles } from 'lucide-react';
import { AIPrompt } from '../types';

interface PromptSelectorProps {
  prompts: AIPrompt[];
  onSelectPrompt: (prompt: AIPrompt) => void;
  loading?: boolean;
  disabled?: boolean;
}

export function PromptSelector({ prompts, onSelectPrompt, loading = false, disabled = false }: PromptSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Agrupar prompts por categoría
  const promptsByCategory = prompts.reduce((acc, prompt) => {
    if (!acc[prompt.category]) {
      acc[prompt.category] = [];
    }
    acc[prompt.category].push(prompt);
    return acc;
  }, {} as Record<string, AIPrompt[]>);

  const categories = Object.keys(promptsByCategory).sort();

  const handleSelectPrompt = (prompt: AIPrompt) => {
    onSelectPrompt(prompt);
    setIsOpen(false);
  };

  if (prompts.length === 0) {
    return (
      <button
        disabled={true}
        className="p-2 rounded-lg bg-gray-100 text-gray-400 cursor-not-allowed"
        title="No hay prompts disponibles"
      >
        <Wand2 className="w-4 h-4" />
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled || loading}
        className="flex items-center gap-2 p-2 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/30 text-purple-600 dark:text-purple-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        title="Seleccionar prompt de IA"
      >
        {loading ? (
          <div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
        ) : (
          <>
            <Wand2 className="w-4 h-4" />
            <ChevronDown className="w-3 h-3" />
          </>
        )}
      </button>

      {isOpen && (
        <>
          {/* Overlay para cerrar */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown menu */}
          <div className="absolute top-full right-0 mt-2 w-80 bg-app rounded-lg shadow-app-lg border border-app z-20 max-h-96 overflow-y-auto">
            <div className="p-3 border-b border-app">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-medium text-app-primary">Prompts de IA</span>
              </div>
            </div>

            <div className="p-2">
              {categories.map(category => (
                <div key={category} className="mb-3 last:mb-0">
                  <div className="px-2 py-1 text-xs font-medium text-app-tertiary uppercase tracking-wide">
                    {category}
                  </div>
                  <div className="space-y-1">
                    {promptsByCategory[category].map(prompt => (
                      <button
                        key={prompt.id}
                        onClick={() => handleSelectPrompt(prompt)}
                        className="w-full text-left p-3 rounded-lg hover:bg-app-secondary transition-colors group"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-app-primary">
                                {prompt.name}
                              </span>
                              {prompt.isDefault && (
                                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                                  Por defecto
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-app-secondary mt-1 line-clamp-2">
                              {prompt.description}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}