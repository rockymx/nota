import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSupabaseClient } from './useSupabaseClient';
import { Folder, Note } from '../types';
import { User } from '@supabase/supabase-js';
import { CACHE_CONFIG } from '../config/constants';

/**
 * Hook especializado para gestión de carpetas con cache optimizado
 */
export function useFolders(user: User | null) {
  const queryClient = useQueryClient();
  const { operations } = useSupabaseClient();

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
      
      const data = await operations.folders.select(user.id);
      if (!data) return [];

      const loadedFolders: Folder[] = data.map((folder: any) => ({
        id: folder.id,
        name: folder.name,
        color: folder.color,
        createdAt: new Date(folder.created_at),
      }));

      return loadedFolders;
    },
    enabled: !!user,
    staleTime: CACHE_CONFIG.FOLDERS_STALE_TIME,
    gcTime: CACHE_CONFIG.GC_TIME,
  });

  // Mutation para crear carpeta
  const createFolderMutation = useMutation({
    mutationFn: async ({ name, color }: { name: string; color: string }) => {
      if (!user) throw new Error('User not authenticated');

      const data = await operations.folders.insert({
        name,
        color,
        user_id: user.id,
      });

      if (!data) throw new Error('Failed to create folder');

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
      if (context?.previousFolders) {
        queryClient.setQueryData(['folders', user?.id], context.previousFolders);
      }
    },
    onSuccess: (newFolder) => {
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

      // First, update notes to remove folder association
      await operations.notes.update('*', user.id, { folder_id: null }, `folder_id.eq.${id}`);

      // Then delete the folder
      await operations.folders.delete(id, user.id);

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
      // Invalidate notes to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['notes', user?.id] });
    },
  });

  // Mutation para restaurar carpeta eliminada
  const restoreFolderMutation = useMutation({
    mutationFn: async ({ folder, affectedNotes }: { folder: Folder; affectedNotes: Note[] }) => {
      if (!user) throw new Error('User not authenticated');

      // Recrear la carpeta con el mismo ID
      await operations.folders.insert({
        id: folder.id,
        name: folder.name,
        color: folder.color,
        user_id: user.id,
        created_at: folder.createdAt.toISOString(),
      });

      // Restaurar las notas a la carpeta
      if (affectedNotes.length > 0) {
        for (const note of affectedNotes) {
          await operations.notes.update(note.id, user.id, { folder_id: folder.id });
        }
      }

      return { folder, affectedNotes };
    },
    onSuccess: ({ folder, affectedNotes }) => {
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
    createFolder,
    deleteFolder,
    restoreFolder,
    refreshFolders,
    isCreating: createFolderMutation.isPending,
    isDeleting: deleteFolderMutation.isPending,
    isRestoring: restoreFolderMutation.isPending,
  };
}