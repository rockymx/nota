import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Note } from '../types';
import { User } from '@supabase/supabase-js';

/**
 * Hook especializado para gestión de notas con cache optimizado
 */
export function useNotes(user: User | null) {
  const queryClient = useQueryClient();
  const [optimisticNotes, setOptimisticNotes] = useState<Note[]>([]);

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
      
      console.log('📝 Loading notes from Supabase...');
      
      const { data, error } = await (supabase as any)
        .from('notes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const loadedNotes: Note[] = (data as any[]).map((note: any) => ({
        id: note.id,
        title: note.title,
        content: note.content || '',
        folderId: note.folder_id,
        tags: note.tags || [],
        createdAt: new Date(note.created_at),
        updatedAt: new Date(note.updated_at),
      }));

      console.log('✅ Notes loaded successfully:', loadedNotes.length);
      return loadedNotes;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Mutation para crear nota
  const createNoteMutation = useMutation({
    mutationFn: async ({ title, content, folderId }: { title: string; content: string; folderId: string | null }) => {
      if (!user) throw new Error('User not authenticated');

      console.log('➕ Creating note:', { title, folderId });
      
      const { data, error } = await (supabase as any)
        .from('notes')
        .insert({
          title,
          content,
          folder_id: folderId,
          user_id: user.id,
        })
        .select('*')
        .single();

      if (error) throw error;

      const newNote: Note = {
        id: data.id,
        title: data.title,
        content: data.content || '',
        folderId: data.folder_id,
        tags: data.tags || [],
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
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
      console.error('❌ Error creating note:', error);
      // Rollback optimistic update
      if (context?.previousNotes) {
        queryClient.setQueryData(['notes', user?.id], context.previousNotes);
      }
    },
    onSuccess: (newNote) => {
      console.log('✅ Note created successfully:', newNote.id);
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

      console.log('✏️ Updating note:', id);
      
      const supabaseUpdates: any = { ...updates };
      if ('folderId' in updates) {
        supabaseUpdates.folder_id = updates.folderId;
        delete supabaseUpdates.folderId;
      }
      delete supabaseUpdates.createdAt;
      delete supabaseUpdates.updatedAt;
      delete supabaseUpdates.id;

      const { error } = await (supabase as any)
        .from('notes')
        .update({
          ...supabaseUpdates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      return { id, updates };
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
      console.error('❌ Error updating note:', error);
      if (context?.previousNotes) {
        queryClient.setQueryData(['notes', user?.id], context.previousNotes);
      }
    },
    onSuccess: ({ id }) => {
      console.log('✅ Note updated successfully:', id);
    },
  });

  // Mutation para eliminar nota
  const deleteNoteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error('User not authenticated');

      console.log('🗑️ Deleting note:', id);
      
      const { error } = await (supabase as any)
        .from('notes')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

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
      console.error('❌ Error deleting note:', error);
      if (context?.previousNotes) {
        queryClient.setQueryData(['notes', user?.id], context.previousNotes);
      }
    },
    onSuccess: (id) => {
      console.log('✅ Note deleted successfully:', id);
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