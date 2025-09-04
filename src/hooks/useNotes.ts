import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSupabaseClient } from './useSupabaseClient';
import { Note } from '../types';
import { User } from '@supabase/supabase-js';
import { CACHE_CONFIG } from '../config/constants';
import { validateAndSanitize, entitySchemas, extractAndValidateHashtags } from '../lib/validation';

/**
 * Hook especializado para gestión de notas con cache optimizado
 */
export function useNotes(user: User | null) {
  const queryClient = useQueryClient();
  const { operations } = useSupabaseClient();

  // Query para cargar notas con cache
  const {
    data: notes = [],
    isLoading: loading,
    error,
    refetch: refetchNotes
  } = useQuery({
    queryKey: ['notes', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const data = await operations.notes.select(user.id);
      if (!data) return [];

      const loadedNotes: Note[] = data.map((note: any) => ({
        id: note.id,
        title: note.title,
        content: note.content || '',
        folderId: note.folder_id,
        tags: note.tags || [],
        createdAt: new Date(note.created_at),
        updatedAt: new Date(note.updated_at),
      }));

      return loadedNotes;
    },
    enabled: !!user,
    staleTime: CACHE_CONFIG.STALE_TIME,
    gcTime: CACHE_CONFIG.GC_TIME,
  });

  // Mutation para crear nota
  const createNoteMutation = useMutation({
    mutationFn: async ({ title, content, folderId }: { title: string; content: string; folderId: string | null }) => {
      if (!user) throw new Error('User not authenticated');

      // Validar y sanitizar datos antes de enviar
      const validatedData = validateAndSanitize(entitySchemas.note, {
        title,
        content,
        folderId,
      });

      // Extraer hashtags del contenido
      const tags = extractAndValidateHashtags(validatedData.content);
      const data = await operations.notes.insert({
        title: validatedData.title,
        content: validatedData.content,
        folder_id: validatedData.folderId,
        tags,
        user_id: user.id,
      });

      if (!data) throw new Error('Failed to create note');

      const newNote: Note = {
        id: (data as any).id,
        title: validatedData.title,
        content: validatedData.content,
        folderId: (data as any).folder_id,
        tags,
        createdAt: new Date((data as any).created_at),
        updatedAt: new Date((data as any).updated_at),
      };

      return newNote;
    },
    onMutate: async ({ title, content, folderId }) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ['notes', user?.id] });
      
      const previousNotes = queryClient.getQueryData(['notes', user?.id]) as Note[] || [];
      
      const optimisticNote: Note = {
        id: `temp-${Date.now()}`,
        title,
        content,
        folderId,
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      queryClient.setQueryData(['notes', user?.id], [optimisticNote, ...previousNotes]);
      
      return { previousNotes };
    },
    onError: (error, variables, context) => {
      // Rollback optimistic update
      if (context?.previousNotes) {
        queryClient.setQueryData(['notes', user?.id], context.previousNotes);
      }
    },
    onSuccess: (newNote) => {
      // Update cache with real note
      queryClient.setQueryData(['notes', user?.id], (old: Note[] = []) => {
        const filtered = old.filter(note => !note.id.startsWith('temp-'));
        return [newNote, ...filtered];
      });
    },
  });

  // Mutation para actualizar nota
  const updateNoteMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Note> }) => {
      if (!user) throw new Error('User not authenticated');

      // Validar y sanitizar actualizaciones
      const validatedUpdates = validateAndSanitize(entitySchemas.note.partial(), updates);

      // Extraer hashtags si se actualiza el contenido
      if (validatedUpdates.content !== undefined) {
        validatedUpdates.tags = extractAndValidateHashtags(validatedUpdates.content);
      }
      const supabaseUpdates: any = { ...updates };
      if ('folderId' in validatedUpdates) {
        supabaseUpdates.folder_id = validatedUpdates.folderId;
        delete supabaseUpdates.folderId;
      }
      delete supabaseUpdates.createdAt;
      delete supabaseUpdates.updatedAt;
      delete supabaseUpdates.id;

      await operations.notes.update(id, user.id, {
        ...supabaseUpdates,
        updated_at: new Date().toISOString(),
      });

      return { id, updates: validatedUpdates };
    },
    onMutate: async ({ id, updates }) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ['notes', user?.id] });
      
      const previousNotes = queryClient.getQueryData(['notes', user?.id]) as Note[] || [];
      
      queryClient.setQueryData(['notes', user?.id], (old: Note[] = []) =>
        old.map(note => 
          note.id === id 
            ? { ...note, ...updates, updatedAt: new Date() }
            : note
        )
      );
      
      return { previousNotes };
    },
    onError: (error, variables, context) => {
      if (context?.previousNotes) {
        queryClient.setQueryData(['notes', user?.id], context.previousNotes);
      }
    },
    onSuccess: ({ id }) => {
    },
  });

  // Mutation para eliminar nota
  const deleteNoteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error('User not authenticated');

      await operations.notes.delete(id, user.id);

      return id;
    },
    onMutate: async (id) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ['notes', user?.id] });
      
      const previousNotes = queryClient.getQueryData(['notes', user?.id]) as Note[] || [];
      
      queryClient.setQueryData(['notes', user?.id], (old: Note[] = []) =>
        old.filter(note => note.id !== id)
      );
      
      return { previousNotes };
    },
    onError: (error, id, context) => {
      if (context?.previousNotes) {
        queryClient.setQueryData(['notes', user?.id], context.previousNotes);
      }
    },
    onSuccess: (id) => {
    },
  });

  // Funciones públicas del hook
  const createNote = useCallback(async (title: string, content: string, folderId: string | null = null) => {
    return createNoteMutation.mutateAsync({ title, content, folderId });
  }, [createNoteMutation]);

  const updateNote = useCallback(async (id: string, updates: Partial<Note>) => {
    return updateNoteMutation.mutateAsync({ id, updates });
  }, [updateNoteMutation]);

  const deleteNote = useCallback(async (id: string) => {
    return deleteNoteMutation.mutateAsync(id);
  }, [deleteNoteMutation]);

  const refreshNotes = useCallback(() => {
    return refetchNotes();
  }, [refetchNotes]);

  return {
    notes,
    loading,
    error: error?.message || null,
    createNote,
    updateNote,
    deleteNote,
    refreshNotes,
    isCreating: createNoteMutation.isPending,
    isUpdating: updateNoteMutation.isPending,
    isDeleting: deleteNoteMutation.isPending,
  };
}