import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Note, Folder } from '../types';
import { User } from '@supabase/supabase-js';

/**
 * Hook personalizado para manejar notas y carpetas con Supabase
 * Incluye autenticación, CRUD de notas y carpetas, y filtrado
 */
export function useSupabaseNotes() {
  // Estados principales
  const [notes, setNotes] = useState<Note[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Estados para filtros
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Gestión del estado de autenticación
  useEffect(() => {
    console.log('🔐 useSupabaseNotes: Auth effect triggered');
    console.log('🔍 Current environment:', {
      mode: import.meta.env.MODE,
      prod: import.meta.env.PROD,
      hasSupabaseUrl: !!import.meta.env.VITE_SUPABASE_URL,
      hasSupabaseKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY
    });
    
    const getUser = async () => {
      try {
        console.log('👤 Attempting to get current user from Supabase...');
        // Agregar timeout para evitar que se cuelgue la aplicación
        const getUserPromise = supabase.auth.getUser();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Auth timeout after 15s')), 15000)
        );
        
        const { data: { user } } = await Promise.race([getUserPromise, timeoutPromise]) as any;
        console.log('👤 Auth result:', {
          hasUser: !!user,
          email: user?.email || 'none',
          id: user?.id || 'none'
        });
        setUser(user);
      } catch (error) {
        console.error('❌ Critical auth error:', error);
        console.error('❌ Error details:', {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : 'No stack'
        });
        
        // Si es un error de sesión inválida, cerrar sesión
        if (error instanceof Error && (
          error.message.includes('session_not_found') ||
          error.message.includes('JWT expired') ||
          error.message.includes('403') ||
          error.message.includes('Auth timeout')
        )) {
          console.log('🔓 Invalid/expired session detected, signing out...');
          await supabase.auth.signOut();
        }
        setUser(null);
      } finally {
        console.log('✅ Auth check completed, setting loading to false');
        setLoading(false);
      }
    };

    console.log('🚀 Starting auth check...');
    getUser();

    // Escuchar cambios en el estado de autenticación
    console.log('👂 Setting up auth state change listener...');
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔐 Auth state change event:', {
          event,
          hasSession: !!session,
          userEmail: session?.user?.email || 'none',
          userId: session?.user?.id || 'none'
        });
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    console.log('✅ Auth listener setup completed');
    return () => subscription.unsubscribe();
  }, []);

  // Cargar datos cuando el usuario está autenticado
  useEffect(() => {
    console.log('📊 useSupabaseNotes: Data loading effect triggered');
    console.log('👤 User state for data loading:', {
      hasUser: !!user,
      email: user?.email || 'none',
      id: user?.id || 'none'
    });
    
    if (user) {
      console.log('📥 User authenticated, starting data load...');
      loadUserData();
    } else {
      // Limpiar datos cuando no hay usuario
      console.log('🧹 No user, clearing local data...');
      setNotes([]);
      setFolders([]);
    }
  }, [user]);

  /**
   * Cargar todas las notas y carpetas del usuario desde Supabase
   */
  const loadUserData = async () => {
    if (!user) return;

    try {
      console.log('📥 Starting loadUserData for user:', user.id);
      console.log('🔗 Testing Supabase connection...');
      
      // Verificar conectividad básica con timeout y retry
      const healthCheckPromise = supabase
        .from('folders')
        .select('count')
        .limit(1);
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection timeout')), 10000)
      );
      
      await Promise.race([healthCheckPromise, timeoutPromise]);
      console.log('✅ Supabase connection test passed');

      console.log('📁 Loading folders from Supabase...');
      // Cargar carpetas
      const foldersPromise = supabase
        .from('folders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      const foldersTimeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Folders request timeout')), 10000)
      );
      
      const { data: foldersData, error: foldersError } = await Promise.race([foldersPromise, foldersTimeoutPromise]) as any;

      if (foldersError) {
        console.error('❌ Folders loading error:', {
          error: foldersError,
          code: foldersError.code,
          message: foldersError.message,
          details: foldersError.details
        });
      } else {
        const loadedFolders: Folder[] = foldersData.map((folder: any) => ({
          id: folder.id,
          name: folder.name,
          color: folder.color,
          createdAt: new Date(folder.created_at),
        }));
        setFolders(loadedFolders);
        console.log('✅ Folders loaded successfully:', {
          count: loadedFolders.length,
          folders: loadedFolders.map(f => ({ id: f.id, name: f.name }))
        });
      }

      console.log('📝 Loading notes from Supabase...');
      // Cargar notas
      const notesPromise = supabase
        .from('notes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      const notesTimeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Notes request timeout')), 10000)
      );
      
      const { data: notesData, error: notesError } = await Promise.race([notesPromise, notesTimeoutPromise]) as any;

      if (notesError) {
        console.error('❌ Notes loading error:', {
          error: notesError,
          code: notesError.code,
          message: notesError.message,
          details: notesError.details
        });
      } else {
        const loadedNotes: Note[] = notesData.map((note: any) => ({
          id: note.id,
          title: note.title,
          content: note.content || '',
          folderId: note.folder_id,
          tags: note.tags || [],
          createdAt: new Date(note.created_at),
          updatedAt: new Date(note.updated_at),
        }));
        setNotes(loadedNotes);
        console.log('✅ Notes loaded successfully:', {
          count: loadedNotes.length,
          notes: loadedNotes.map(n => ({ id: n.id, title: n.title }))
        });
      }
      
      console.log('✅ loadUserData completed successfully');
    } catch (error) {
      console.error('❌ Critical error in loadUserData:', {
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack',
        userId: user.id
      });
      
      // Manejo específico de errores de red con retry
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        console.error('🌐 Network error detected in production. Retrying in 3 seconds...');
        
        // Retry después de 3 segundos
        setTimeout(() => {
          console.log('🔄 Network retry: Attempting data load again...');
          loadUserData();
        }, 3000);
        return;
      }
      
      // Manejo de errores de timeout
      if (error instanceof Error && error.message.includes('timeout')) {
        console.error('⏱️ Request timeout in production. Retrying...');
        
        // Retry después de 2 segundos
        setTimeout(() => {
          console.log('🔄 Timeout retry: Attempting data load again...');
          loadUserData();
        }, 2000);
        return;
      }
      
      // Si es un error de sesión inválida, cerrar sesión
      if (error instanceof Error && (
        error.message.includes('session_not_found') ||
        error.message.includes('JWT expired') ||
        error.message.includes('403') ||
        error.message.includes('unauthorized')
      )) {
        console.log('🔓 Invalid session detected in production, signing out...');
        await supabase.auth.signOut();
      }
    }
  };

  /**
   * Crear una nueva carpeta
   * @param name Nombre de la carpeta
   * @param color Color hexadecimal de la carpeta
   * @returns La carpeta creada o null si hay error
   */
  const createFolder = async (name: string, color: string) => {
    if (!user) return null;
    
    try {
      console.log('📁 createFolder called:', { name, color, userId: user.id });
      // Usar timeout para evitar que se cuelgue
      const insertPromise = (supabase as any)
        .from('folders')
        .insert({
          name,
          color,
          user_id: user.id,
        })
        .select('*')
        .single();

      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 10000)
      );

      const { data, error } = await Promise.race([insertPromise, timeoutPromise]) as any;

      if (error) throw error;

      const newFolder: Folder = {
        id: data.id,
        name: data.name,
        color: data.color,
        createdAt: new Date(data.created_at),
      };

      setFolders(prev => [...prev, newFolder]);
      console.log('✅ Folder created successfully:', {
        id: newFolder.id,
        name: newFolder.name,
        color: newFolder.color
      });
      return newFolder;
    } catch (error) {
      console.error('❌ createFolder error:', {
        error,
        message: error instanceof Error ? error.message : 'Unknown',
        userId: user.id,
        folderName: name
      });
      
      // Si es un error de sesión inválida, cerrar sesión
      if (error instanceof Error && (
        error.message.includes('session_not_found') ||
        error.message.includes('JWT expired') ||
        error.message.includes('403')
      )) {
        console.log('🔓 Invalid session detected, signing out...');
        await supabase.auth.signOut();
        return null;
      }
      // Crear carpeta localmente como fallback
      const fallbackFolder: Folder = {
        id: crypto.randomUUID(),
        name,
        color,
        createdAt: new Date(),
      };
      setFolders(prev => [...prev, fallbackFolder]);
      console.log('⚠️ Using fallback folder creation due to error');
      return fallbackFolder;
    }
  };

  /**
   * Crear una nueva nota
   * @param title Título de la nota
   * @param content Contenido de la nota
   * @param folderId ID de la carpeta (opcional)
   * @returns La nota creada o null si hay error
   */
  const createNote = async (title: string, content: string, folderId: string | null = null) => {
    if (!user) return null;

    try {
      console.log('📝 createNote called:', { 
        title, 
        contentLength: content.length,
        contentPreview: content.substring(0, 50) + '...', 
        folderId,
        userId: user.id 
      });
      
      // Usar timeout para evitar que se cuelgue
      const insertPromise = (supabase as any)
        .from('notes')
        .insert({
          title,
          content,
          folder_id: folderId,
          user_id: user.id,
        })
        .select('*')
        .single();

      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 10000)
      );

      const { data, error } = await Promise.race([insertPromise, timeoutPromise]) as any;

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

      setNotes(prev => [newNote, ...prev]);
      console.log('✅ Note created successfully:', {
        id: newNote.id,
        title: newNote.title,
        folderId: newNote.folderId
      });
      return newNote;
    } catch (error) {
      console.error('❌ createNote error:', {
        error,
        message: error instanceof Error ? error.message : 'Unknown',
        userId: user.id,
        noteTitle: title
      });
      
      // Si es un error de sesión inválida, cerrar sesión
      if (error instanceof Error && (
        error.message.includes('session_not_found') ||
        error.message.includes('JWT expired') ||
        error.message.includes('403')
      )) {
        console.log('🔓 Invalid session detected, signing out...');
        await supabase.auth.signOut();
        return null;
      }
      // Crear nota localmente como fallback
      const fallbackNote: Note = {
        id: crypto.randomUUID(),
        title,
        content,
        folderId,
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setNotes(prev => [fallbackNote, ...prev]);
      console.log('⚠️ Using fallback note creation due to error');
      return fallbackNote;
    }
  };

  /**
   * Actualizar una nota existente
   * @param id ID de la nota a actualizar
   * @param updates Campos a actualizar
   */
  const updateNote = async (id: string, updates: Partial<Note>) => {
    if (!user) return;

    try {
      console.log('✏️ updateNote called:', { 
        noteId: id, 
        updates,
        userId: user.id 
      });
      
      // Mapear folderId a folder_id para Supabase
      const supabaseUpdates: any = { ...updates };
      if ('folderId' in updates) {
        supabaseUpdates.folder_id = updates.folderId;
        delete supabaseUpdates.folderId;
      }
      // Remover campos que no existen en la base de datos
      delete supabaseUpdates.createdAt;
      delete supabaseUpdates.updatedAt;
      delete supabaseUpdates.id;

      const updatePromise = (supabase as any)
        .from('notes')
        .update({
          ...supabaseUpdates,
          updated_at: new Date().toISOString(),
        } as any)
        .eq('id', id)
        .eq('user_id', user.id);

      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 10000)
      );

      const { error } = await Promise.race([updatePromise, timeoutPromise]) as any;

      if (error) throw error;

      setNotes(prev => prev.map(note => 
        note.id === id 
          ? { ...note, ...updates, updatedAt: new Date() }
          : note
      ));
      console.log('✅ Note updated successfully:', id);
    } catch (error) {
      console.error('❌ updateNote error:', {
        error,
        message: error instanceof Error ? error.message : 'Unknown',
        noteId: id,
        userId: user.id
      });
      
      // Si es un error de sesión inválida, cerrar sesión
      if (error instanceof Error && (
        error.message.includes('session_not_found') ||
        error.message.includes('JWT expired') ||
        error.message.includes('403')
      )) {
        console.log('🔓 Invalid session detected, signing out...');
        await supabase.auth.signOut();
        return;
      }
      // Actualizar localmente como fallback
      setNotes(prev => prev.map(note => 
        note.id === id 
          ? { ...note, ...updates, updatedAt: new Date() }
          : note
      ));
      console.log('⚠️ Using fallback note update due to error');
    }
  };

  /**
   * Eliminar una nota
   * @param id ID de la nota a eliminar
   */
  const deleteNote = async (id: string) => {
    if (!user) return;

    try {
      console.log('🗑️ deleteNote called:', { noteId: id, userId: user.id });
      
      const deletePromise = supabase
        .from('notes')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 10000)
      );

      await Promise.race([deletePromise, timeoutPromise]);

      setNotes(prev => prev.filter(note => note.id !== id));
      console.log('✅ Note deleted successfully:', id);
    } catch (error) {
      console.error('❌ deleteNote error:', {
        error,
        message: error instanceof Error ? error.message : 'Unknown',
        noteId: id,
        userId: user.id
      });
      
      // Si es un error de sesión inválida, cerrar sesión
      if (error instanceof Error && (
        error.message.includes('session_not_found') ||
        error.message.includes('JWT expired') ||
        error.message.includes('403')
      )) {
        console.log('🔓 Invalid session detected, signing out...');
        await supabase.auth.signOut();
        return;
      }
      // Eliminar localmente como fallback
      setNotes(prev => prev.filter(note => note.id !== id));
      console.log('⚠️ Using fallback note deletion due to error');
    }
  };

  /**
   * Eliminar una carpeta y actualizar las notas asociadas
   * @param id ID de la carpeta a eliminar
   */
  const deleteFolder = async (id: string) => {
    if (!user) return;

    try {
      console.log('🗑️ deleteFolder called:', { folderId: id, userId: user.id });
      
      // Primero, actualizar notas para remover la asociación con la carpeta
      const updateNotesPromise = (supabase as any)
        .from('notes')
        .update({ folder_id: null } as any)
        .eq('folder_id', id)
        .eq('user_id', user.id);

      const timeoutPromise1 = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 10000)
      );

      await Promise.race([updateNotesPromise, timeoutPromise1]);

      // Luego, eliminar la carpeta
      const deleteFolderPromise = supabase
        .from('folders')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      const timeoutPromise2 = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 10000)
      );

      await Promise.race([deleteFolderPromise, timeoutPromise2]);

      // Actualizar estado local
      setFolders(prev => prev.filter(folder => folder.id !== id));
      setNotes(prev => prev.map(note => 
        note.folderId === id 
          ? { ...note, folderId: null }
          : note
      ));

      // Limpiar selección si la carpeta eliminada estaba seleccionada
      if (selectedFolderId === id) {
        setSelectedFolderId(null);
      }
      
      console.log('✅ Folder deleted successfully:', id);
    } catch (error) {
      console.error('❌ deleteFolder error:', {
        error,
        message: error instanceof Error ? error.message : 'Unknown',
        folderId: id,
        userId: user.id
      });
      
      // Si es un error de sesión inválida, cerrar sesión
      if (error instanceof Error && (
        error.message.includes('session_not_found') ||
        error.message.includes('JWT expired') ||
        error.message.includes('403')
      )) {
        console.log('🔓 Invalid session detected, signing out...');
        await supabase.auth.signOut();
        return;
      }
      // Eliminar localmente como fallback
      setFolders(prev => prev.filter(folder => folder.id !== id));
      setNotes(prev => prev.map(note => 
        note.folderId === id 
          ? { ...note, folderId: null }
          : note
      ));
      
      if (selectedFolderId === id) {
        setSelectedFolderId(null);
      }
      
      console.log('⚠️ Using fallback folder deletion due to error');
    }
  };

  /**
   * Obtener notas filtradas según carpeta y fecha seleccionada
   * @returns Array de notas filtradas
   */
  const getFilteredNotes = () => {
    let filtered = notes;

    console.log('🔍 getFilteredNotes called:', {
      totalNotes: notes.length,
      selectedFolderId,
      selectedDate: selectedDate?.toISOString()
    });

    // Filtrar por carpeta si hay una seleccionada
    if (selectedFolderId) {
      filtered = filtered.filter(note => note.folderId === selectedFolderId);
      console.log('📁 Filtered by folder:', filtered.length);
    }

    // Filtrar por fecha si hay una seleccionada
    if (selectedDate) {
      const dateStr = selectedDate.toDateString();
      filtered = filtered.filter(note => 
        new Date(note.createdAt).toDateString() === dateStr
      );
      console.log('📅 Filtered by date:', filtered.length);
    }

    console.log('✅ Final filtered notes:', filtered.length);
    return filtered;
  };

  console.log('🔄 useSupabaseNotes hook returning state:', {
    hasUser: !!user,
    loading,
    notesCount: notes.length,
    foldersCount: folders.length
  });

  // Retornar todas las funciones y estados necesarios
  return {
    user,
    loading,
    notes,
    folders,
    selectedFolderId,
    selectedDate,
    setSelectedFolderId,
    setSelectedDate,
    createNote,
    updateNote,
    deleteNote,
    createFolder,
    deleteFolder,
    getFilteredNotes,
  };
}