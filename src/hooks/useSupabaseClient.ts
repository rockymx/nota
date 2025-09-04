import { useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useErrorHandler } from './useErrorHandler';
import { TIMEOUTS } from '../config/constants';
import { ValidationInterceptor, validateAndSanitize, entitySchemas } from '../lib/validation';

/**
 * Hook para operaciones de Supabase con manejo de errores centralizado
 */
export function useSupabaseClient() {
  const { withDatabaseErrorHandling } = useErrorHandler();

  /**
   * Wrapper para queries de Supabase con timeout y manejo de errores
   */
  const query = useCallback(async <T>(
    operation: () => Promise<{ data: T; error: any }>,
    operationName: string,
    timeout: number = TIMEOUTS.DATABASE
  ): Promise<T | null> => {
    return withDatabaseErrorHandling(async () => {
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error(`${operationName} timeout after ${timeout}ms`)), timeout)
      );

      const { data, error } = await Promise.race([operation(), timeoutPromise]) as any;

      if (error) {
        throw error;
      }

      return data;
    }, operationName);
  }, [withDatabaseErrorHandling]);

  /**
   * Wrapper para mutations de Supabase con timeout y manejo de errores
   */
  const mutate = useCallback(async <T>(
    operation: () => Promise<{ data: T; error: any }>,
    operationName: string,
    timeout: number = TIMEOUTS.DATABASE,
    validationData?: { table: string; data: any }
  ): Promise<T | null> => {
    return withDatabaseErrorHandling(async () => {
      // Validar datos antes de la operación si se proporciona
      if (validationData) {
        try {
          ValidationInterceptor.validateBeforeInsert(validationData.table, validationData.data);
        } catch (validationError) {
          throw new Error(`Validación fallida: ${validationError instanceof Error ? validationError.message : 'Error desconocido'}`);
        }
      }
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error(`${operationName} timeout after ${timeout}ms`)), timeout)
      );

      const { data, error } = await Promise.race([operation(), timeoutPromise]) as any;

      if (error) {
        throw error;
      }

      return data;
    }, operationName, null);
  }, [withDatabaseErrorHandling]);

  /**
   * Operaciones específicas con manejo de errores optimizado
   */
  const operations = {
    // Operaciones de notas
    notes: {
      select: (userId: string) => query(
        () => (supabase as any).from('notes').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
        'load_notes'
      ),
      
      insert: (noteData: any) => mutate(
        () => (supabase as any).from('notes').insert(noteData).select('*').single(),
        'create_note',
        TIMEOUTS.DATABASE,
        { table: 'notes', data: noteData }
      ),
      
      update: (id: string, userId: string, updates: any) => mutate(
        () => (supabase as any).from('notes').update(updates).eq('id', id).eq('user_id', userId),
        'update_note',
        TIMEOUTS.DATABASE,
        { table: 'notes', data: updates }
      ),
      
      delete: (id: string, userId: string) => mutate(
        () => (supabase as any).from('notes').delete().eq('id', id).eq('user_id', userId),
        'delete_note'
      ),
    },

    // Operaciones de carpetas
    folders: {
      select: (userId: string) => query(
        () => (supabase as any).from('folders').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
        'load_folders'
      ),
      
      insert: (folderData: any) => mutate(
        () => (supabase as any).from('folders').insert(folderData).select('*').single(),
        'create_folder',
        TIMEOUTS.DATABASE,
        { table: 'folders', data: folderData }
      ),
      
      delete: (id: string, userId: string) => mutate(
        () => (supabase as any).from('folders').delete().eq('id', id).eq('user_id', userId),
        'delete_folder'
      ),
    },

    // Operaciones de configuración de usuario
    userSettings: {
      select: (userId: string) => query(
        () => (supabase as any).from('user_settings').select('*').eq('user_id', userId).maybeSingle(),
        'load_user_settings'
      ),
      
      upsert: (settingsData: any) => mutate(
        () => (supabase as any).from('user_settings').upsert(settingsData, { onConflict: 'user_id' }),
        'save_user_settings'
      ),
    },

    // Operaciones de prompts de IA
    aiPrompts: {
      select: (userId: string) => query(
        () => (supabase as any).from('ai_prompts').select('*').or(`user_id.eq.${userId},is_default.eq.true`).order('is_default', { ascending: false }).order('created_at', { ascending: false }),
        'load_ai_prompts'
      ),
      
      insert: (promptData: any) => mutate(
        () => (supabase as any).from('ai_prompts').insert(promptData).select('*').single(),
       'create_ai_prompt',
       TIMEOUTS.DATABASE,
       { table: 'ai_prompts', data: promptData }
      ),
      
      update: (id: string, userId: string, updates: any) => mutate(
        () => (supabase as any).from('ai_prompts').update(updates).eq('id', id).eq('user_id', userId),
       'update_ai_prompt',
       TIMEOUTS.DATABASE,
       { table: 'ai_prompts', data: updates }
      ),
      
      delete: (id: string, userId: string) => mutate(
        () => (supabase as any).from('ai_prompts').delete().eq('id', id).eq('user_id', userId),
        'delete_ai_prompt'
      ),
    },

    // Operaciones de prompts ocultos
    hiddenPrompts: {
      select: (userId: string) => query(
        () => (supabase as any).from('hidden_prompts').select('*').eq('user_id', userId),
        'load_hidden_prompts'
      ),
      
      insert: (hiddenPromptData: any) => mutate(
        () => (supabase as any).from('hidden_prompts').insert(hiddenPromptData).select('*').single(),
        'create_hidden_prompt',
        TIMEOUTS.DATABASE,
        { table: 'hidden_prompts', data: hiddenPromptData }
      ),
      
      delete: (promptId: string, userId: string) => mutate(
        () => (supabase as any).from('hidden_prompts').delete().eq('prompt_id', promptId).eq('user_id', userId),
        'delete_hidden_prompt'
      ),
    },
  };

  return {
    query,
    mutate,
    operations,
  };
}