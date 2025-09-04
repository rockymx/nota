import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Folder, Note } from '../types';
import { User } from '@supabase/supabase-js';

/**
 * Hook especializado para gestión de carpetas con cache optimizado
 */
export function useFolders(user: User | null) {
  const queryClient = useQueryClient();

  // Query para cargar carpetas con cache
  const {
    data: folders = [],
    isLoading: loading,
    error,
    refetch: refetchFolders
  } = useQuery({
    queryKey: ['folders', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      console.log('📁 Loading folders from Supabase...');
      
      const { data, error } = await (supabase as any)
        .from('folders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const loadedFolders: Folder[] = (data as any[]).map((folder: any) => ({
        id: folder.id,
        name: folder.name,
        color: folder.color,
        createdAt: new Date(folder.created_at),
      }));

      console.log('✅ Folders loaded successfully:', loadedFolders.length);
      return loadedFolders;
    },
    enabled: !!user,
    staleTime: 10 * 60 * 1000, // 10 minutes (folders change less frequently)
    gcTime: 15 * 60 * 1000, // 15 minutes
  });

  // Mutation para crear carpeta
  const createFolderMutation = useMutation({
    mutationFn: async ({ name, color }: { name: string; color: string }) => {
      if (!user) throw new Error('User not authenticated');

      console.log('📁 Creating folder:', { name, color });
      
      const { data, error } = await (supabase as any)
        .from('folders')
        .insert({
          name,
          color,
          user_id: user.id,
        })
        .select('*')
        .single();

      if (error) throw error;

      const newFolder: Folder = {
        id: data.id,
        name: data.name,
        color: data.color,
        createdAt: new Date(data.created_at),
      };

      return newFolder;
    },
    onMutate: async ({ name, color }) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ['folders', user?.id] });
      
      const previousFolders = queryClient.getQueryData(['folders', user?.id]) as Folder[] || [];
      
      const optimisticFolder: Folder = {
        id: `temp-${Date.now()}`,
        name,
        color,
        createdAt: new Date(),
      };

      queryClient.setQueryData(['folders', user?.id], [...previousFolders, optimisticFolder]);
      
      return { previousFolders };
    },
    onError: (error, variables, context) => {
      console.error('❌ Error creating folder:', error);
      if (context?.previousFolders) {
        queryClient.setQueryData(['folders', user?.id], context.previousFolders);
      }
    },
    onSuccess: (newFolder) => {
      console.log('✅ Folder created successfully:', newFolder.id);
      // Update cache with real folder
      queryClient.setQueryData(['folders', user?.id], (old: Folder[] = []) => {
        const filtered = old.filter(folder => !folder.id.startsWith('temp-'));
        return [...filtered, newFolder];
      });
    },
  });

  // Mutation para eliminar carpeta
  const deleteFolderMutation = useMutation({
    mutationFn: async ({ id, skipUndo = false }: { id: string; skipUndo?: boolean }) => {
      if (!user) throw new Error('User not authenticated');

      console.log('🗑️ Deleting folder:', id);
      
      // First, update notes to remove folder association
      const { error: moveError } = await (supabase as any)
        .from('notes')
        .update({ folder_id: null })
        .eq('folder_id', id)
        .eq('user_id', user.id);

      // Then delete the folder
      const { error } = await (supabase as any)
        .from('folders')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      return { id, skipUndo };
    },
    onMutate: async ({ id }) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ['folders', user?.id] });
      
      const previousFolders = queryClient.getQueryData(['folders', user?.id]) as Folder[] || [];
      const previousNotes = queryClient.getQueryData(['notes', user?.id]) as Note[] || [];
      
      queryClient.setQueryData(['folders', user?.id], (old: Folder[] = []) =>
        old.filter(folder => folder.id !== id)
      );

      // Also update notes cache to remove folder association
      queryClient.setQueryData(['notes', user?.id], (old: Note[] = []) =>
        old.map(note => 
          note.folderId === id 
            ? { ...note, folderId: null }
            : note
        )
      );
      
      return { previousFolders, previousNotes };
    },
    onError: (error, { id }, context) => {
      console.error('❌ Error deleting folder:', error);
      if (context?.previousFolders) {
        queryClient.setQueryData(['folders', user?.id], context.previousFolders);
      }
      if (context?.previousNotes) {
        queryClient.setQueryData(['notes', user?.id], context.previousNotes);
      }
      // Refresh notes to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['notes', user?.id] });
    },
    onSuccess: ({ id }) => {
      console.log('✅ Folder deleted successfully:', id);
      // Invalidate notes to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['notes', user?.id] });
    },
  });

  // Mutation para restaurar carpeta eliminada
  const restoreFolderMutation = useMutation({
    mutationFn: async ({ folder, affectedNotes }: { folder: Folder; affectedNotes: Note[] }) => {
      if (!user) throw new Error('User not authenticated');

      console.log('🔄 Restoring folder:', folder.name);
      
      // Recrear la carpeta con el mismo ID
      const { error: folderError } = await (supabase as any)
        .from('folders')
        .insert({
          id: folder.id,
          name: folder.name,
          color: folder.color,
          user_id: user.id,
          created_at: folder.createdAt.toISOString(),
        });

      if (folderError) throw folderError;

      // Restaurar las notas a la carpeta
      if (affectedNotes.length > 0) {
        const { error: notesError } = await (supabase as any)
          .from('notes')
          .update({ folder_id: folder.id })
          .in('id', affectedNotes.map(note => note.id));

        if (notesError) throw notesError;
      }

      return { folder, affectedNotes };
    },
    onSuccess: ({ folder, affectedNotes }) => {
      console.log('✅ Folder restored successfully:', folder.name);
      
      // Update cache with restored folder
      queryClient.setQueryData(['folders', user?.id], (old: Folder[] = []) => {
        const filtered = old.filter(f => f.id !== folder.id);
        return [...filtered, folder];
      });

      // Update notes cache to restore folder association
      queryClient.setQueryData(['notes', user?.id], (old: Note[] = []) =>
        old.map(note => {
          const affectedNote = affectedNotes.find(an => an.id === note.id);
          return affectedNote ? { ...note, folderId: folder.id } : note;
        })
      );
    },
    onError: (error) => {
      console.error('❌ Error restoring folder:', error);
      // Refresh all data to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['folders', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['notes', user?.id] });
    },
  });
  // Funciones públicas del hook
  const createFolder = useCallback(async (name: string, color: string) => {
    return createFolderMutation.mutateAsync({ name, color });
  }, [createFolderMutation]);

  const deleteFolder = useCallback(async (id: string, skipUndo: boolean = false) => {
    return deleteFolderMutation.mutateAsync({ id, skipUndo });
  }, [deleteFolderMutation]);

  const restoreFolder = useCallback(async (folder: Folder, affectedNotes: Note[]) => {
    return restoreFolderMutation.mutateAsync({ folder, affectedNotes });
  }, [restoreFolderMutation]);

  const refreshFolders = useCallback(() => {
    return refetchFolders();
  }, [refetchFolders]);

  // Invalidar cache cuando el usuario cambia
  return {
    folders,
    loading,
    error: error?.message || null,
    createFolder,
    deleteFolder,
    restoreFolder,
    refreshFolders,
    isCreating: createFolderMutation.isPending,
    isDeleting: deleteFolderMutation.isPending,
    isRestoring: restoreFolderMutation.isPending,
  };
}