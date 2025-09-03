import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { AIPrompt } from '../types';
import { User } from '@supabase/supabase-js';

/**
 * Hook personalizado para manejar prompts de IA con Supabase
 */
export function useAIPrompts(user: User | null) {
  const [prompts, setPrompts] = useState<AIPrompt[]>([]);
  const [hiddenPromptIds, setHiddenPromptIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

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

    try {
      console.log('🤖 Loading AI prompts from Supabase...');
      
      // Cargar prompts ocultos del usuario
      const { data: hiddenData, error: hiddenError } = await (supabase as any)
        .from('hidden_prompts')
        .select('prompt_id')
        .eq('user_id', user.id);

      if (hiddenError) {
        console.error('❌ Error loading hidden prompts:', hiddenError);
      } else {
        const hiddenIds = new Set((hiddenData as any[]).map((h: any) => h.prompt_id));
        setHiddenPromptIds(hiddenIds);
      }

      // Cargar todos los prompts
      const { data, error } = await (supabase as any)
        .from('ai_prompts')
        .select('*')
        .or(`user_id.eq.${user.id},is_default.eq.true`)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;

      const loadedPrompts: AIPrompt[] = (data as any[]).map((prompt: any) => ({
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
      console.log('✅ Loaded AI prompts:', loadedPrompts.length);
    } catch (error) {
      console.error('❌ Error loading AI prompts:', error);
    } finally {
      setLoading(false);
    }
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

    try {
      console.log('➕ Creating new AI prompt:', { name, category });
      
      const { data, error } = await (supabase as any)
        .from('ai_prompts')
        .insert([{
          name,
          description,
          prompt_template: promptTemplate,
          category,
          is_default: false,
          user_id: user.id,
        }])
        .select('*')
        .single();

      if (error) throw error;

      const newPrompt: AIPrompt = {
        id: (data as any).id,
        name: (data as any).name,
        description: (data as any).description,
        promptTemplate: (data as any).prompt_template,
        category: (data as any).category,
        isDefault: (data as any).is_default,
        userId: (data as any).user_id,
        createdAt: new Date((data as any).created_at),
        updatedAt: new Date((data as any).updated_at),
      };

      setPrompts(prev => [newPrompt, ...prev]);
      console.log('✅ AI prompt created successfully');
      return newPrompt;
    } catch (error) {
      console.error('❌ Error creating AI prompt:', error);
      return null;
    }
  };

  /**
   * Actualizar un prompt existente
   */
  const updatePrompt = async (
    id: string,
    updates: Partial<Pick<AIPrompt, 'name' | 'description' | 'promptTemplate' | 'category'>>
  ) => {
    if (!user) return;

    try {
      console.log('✏️ Updating AI prompt:', id);
      
      const supabaseUpdates: any = {};
      if (updates.name) supabaseUpdates.name = updates.name;
      if (updates.description) supabaseUpdates.description = updates.description;
      if (updates.promptTemplate) supabaseUpdates.prompt_template = updates.promptTemplate;
      if (updates.category) supabaseUpdates.category = updates.category;
      supabaseUpdates.updated_at = new Date().toISOString();

      const { error } = await (supabase as any)
        .from('ai_prompts')
        .update(supabaseUpdates)
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setPrompts(prev => prev.map(prompt =>
        prompt.id === id
          ? { ...prompt, ...updates, updatedAt: new Date() }
          : prompt
      ));
      console.log('✅ AI prompt updated successfully');
    } catch (error) {
      console.error('❌ Error updating AI prompt:', error);
    }
  };

  /**
   * Eliminar un prompt personalizado
   */
  const deletePrompt = async (id: string) => {
    if (!user) return;

    try {
      console.log('🗑️ Deleting AI prompt:', id);
      
      const { error } = await (supabase as any)
        .from('ai_prompts')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setPrompts(prev => prev.filter(prompt => prompt.id !== id));
      console.log('✅ AI prompt deleted successfully');
    } catch (error) {
      console.error('❌ Error deleting AI prompt:', error);
    }
  };

  /**
   * Ocultar un prompt por defecto
   */
  const hideDefaultPrompt = async (promptId: string) => {
    if (!user) return;

    try {
      console.log('👁️ Hiding default prompt:', promptId);
      
      const { error } = await (supabase as any)
        .from('hidden_prompts')
        .insert([{
          user_id: user.id,
          prompt_id: promptId,
        }]);

      if (error) throw error;

      setHiddenPromptIds(prev => new Set([...prev, promptId]));
      console.log('✅ Default prompt hidden successfully');
    } catch (error) {
      console.error('❌ Error hiding default prompt:', error);
    }
  };

  /**
   * Mostrar un prompt por defecto oculto
   */
  const showDefaultPrompt = async (promptId: string) => {
    if (!user) return;

    try {
      console.log('👁️ Showing default prompt:', promptId);
      
      const { error } = await (supabase as any)
        .from('hidden_prompts')
        .delete()
        .eq('user_id', user.id)
        .eq('prompt_id', promptId);

      if (error) throw error;

      setHiddenPromptIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(promptId);
        return newSet;
      });
      console.log('✅ Default prompt shown successfully');
    } catch (error) {
      console.error('❌ Error showing default prompt:', error);
    }
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