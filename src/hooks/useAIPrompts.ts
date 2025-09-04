import { useState, useEffect } from 'react';
import { useSupabaseClient } from './useSupabaseClient';
import { AIPrompt } from '../types';
import { User } from '@supabase/supabase-js';

/**
 * Hook personalizado para manejar prompts de IA con Supabase
 */
export function useAIPrompts(user: User | null) {
  const [prompts, setPrompts] = useState<AIPrompt[]>([]);
  const [hiddenPromptIds, setHiddenPromptIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const { operations } = useSupabaseClient();

  // Cargar prompts cuando el usuario cambia
  useEffect(() => {
    if (user) {
      loadPrompts();
    } else {
      setPrompts([]);
      setLoading(false);
    }
  }, [user]);

  /**
   * Cargar todos los prompts (propios y por defecto) desde Supabase
   */
  const loadPrompts = async () => {
    if (!user) return;

    console.log('🤖 Loading AI prompts from Supabase...');
    
    // Cargar prompts ocultos del usuario
    const hiddenData = await operations.hiddenPrompts?.select?.(user.id);
    if (hiddenData) {
      const hiddenIds = new Set(hiddenData.map((h: any) => h.prompt_id));
      setHiddenPromptIds(hiddenIds);
    }

    // Cargar todos los prompts
    const data = await operations.aiPrompts.select(user.id);
    if (data) {
      const loadedPrompts: AIPrompt[] = data.map((prompt: any) => ({
        id: prompt.id,
        name: prompt.name,
        description: prompt.description,
        promptTemplate: prompt.prompt_template,
        category: prompt.category,
        isDefault: prompt.is_default,
        userId: prompt.user_id,
        createdAt: new Date(prompt.created_at),
        updatedAt: new Date(prompt.updated_at),
      }));

      setPrompts(loadedPrompts);
    }
    
    setLoading(false);
  };

  /**
   * Crear un nuevo prompt personalizado
   */
  const createPrompt = async (
    name: string,
    description: string,
    promptTemplate: string,
    category: string = 'custom'
  ) => {
    if (!user) return null;

    const data = await operations.aiPrompts.insert({
      name,
      description,
      prompt_template: promptTemplate,
      category,
      is_default: false,
      user_id: user.id,
    });

    if (!data) return null;

    const newPrompt: AIPrompt = {
      id: data.id,
      name: data.name,
      description: data.description,
      promptTemplate: data.prompt_template,
      category: data.category,
      isDefault: data.is_default,
      userId: data.user_id,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };

    setPrompts(prev => [newPrompt, ...prev]);
    return newPrompt;
  };

  /**
   * Actualizar un prompt existente
   */
  const updatePrompt = async (
    id: string,
    updates: Partial<Pick<AIPrompt, 'name' | 'description' | 'promptTemplate' | 'category'>>
  ) => {
    if (!user) return;

    const supabaseUpdates: any = {};
    if (updates.name) supabaseUpdates.name = updates.name;
    if (updates.description) supabaseUpdates.description = updates.description;
    if (updates.promptTemplate) supabaseUpdates.prompt_template = updates.promptTemplate;
    if (updates.category) supabaseUpdates.category = updates.category;
    supabaseUpdates.updated_at = new Date().toISOString();

    await operations.aiPrompts.update(id, user.id, supabaseUpdates);

    setPrompts(prev => prev.map(prompt =>
      prompt.id === id
        ? { ...prompt, ...updates, updatedAt: new Date() }
        : prompt
    ));
  };

  /**
   * Eliminar un prompt personalizado
   */
  const deletePrompt = async (id: string) => {
    if (!user) return;

    await operations.aiPrompts.delete(id, user.id);
    setPrompts(prev => prev.filter(prompt => prompt.id !== id));
  };

  /**
   * Ocultar un prompt por defecto
   */
  const hideDefaultPrompt = async (promptId: string) => {
    if (!user) return;

    await operations.hiddenPrompts?.insert?.({
      user_id: user.id,
      prompt_id: promptId,
    });

    setHiddenPromptIds(prev => new Set([...prev, promptId]));
  };

  /**
   * Mostrar un prompt por defecto oculto
   */
  const showDefaultPrompt = async (promptId: string) => {
    if (!user) return;

    await operations.hiddenPrompts?.delete?.(promptId, user.id);

    setHiddenPromptIds(prev => {
      const newSet = new Set(prev);
      newSet.delete(promptId);
      return newSet;
    });
  };

  /**
   * Obtener prompts visibles (no ocultos) para el selector
   */
  const getVisiblePrompts = () => {
    return prompts.filter(prompt => 
      !prompt.isDefault || !hiddenPromptIds.has(prompt.id)
    );
  };

  /**
   * Obtener prompts por categoría
   */
  const getPromptsByCategory = (category: string) => {
    return prompts.filter(prompt => prompt.category === category);
  };

  /**
   * Obtener todas las categorías disponibles
   */
  const getCategories = () => {
    const categories = [...new Set(prompts.map(prompt => prompt.category))];
    return categories.sort();
  };

  return {
    prompts,
    hiddenPromptIds,
    loading,
    createPrompt,
    updatePrompt,
    deletePrompt,
    hideDefaultPrompt,
    showDefaultPrompt,
    getVisiblePrompts,
    getPromptsByCategory,
    getCategories,
    refreshPrompts: loadPrompts,
  };
}