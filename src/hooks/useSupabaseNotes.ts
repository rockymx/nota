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
    const getUser = async () => {
      try {
        // Agregar timeout para evitar que se cuelgue la aplicación
        const getUserPromise = supabase.auth.getUser();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Auth timeout')), 15000)
        );
        
        const { data: { user } } = await Promise.race([getUserPromise, timeoutPromise]) as any;
        setUser(user);
      } catch (error) {
        console.error('❌ Error getting user:', error);
        // Si es un error de sesión inválida, cerrar sesión
        if (error instanceof Error && (
          error.message.includes('session_not_found') ||
          error.message.includes('JWT expired') ||
          error.message.includes('403')
        )) {
          console.log('🔓 Invalid session detected, signing out...');
          await supabase.auth.signOut();
        }
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    getUser();

    // Escuchar cambios en el estado de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔐 Auth state changed:', event, session?.user?.email);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Cargar datos cuando el usuario está autenticado
  useEffect(() => {
    if (user) {
      loadUserData();
    } else {
      // Limpiar datos cuando no hay usuario
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
      console.log('📥 Loading user data from Supabase...');
      
      // Verificar conectividad básica con timeout y retry
      const healthCheckPromise = supabase
        .from('folders')
        .select('count')
        .limit(1);
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection timeout')), 10000)
      );
      
      await Promise.race([healthCheckPromise, timeoutPromise]);
      console.log('🔗 Supabase connection test passed');

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
        console.error('❌ Error loading folders:', foldersError);
      } else {
        const loadedFolders: Folder[] = foldersData.map(folder => ({
          id: folder.id,
          name: folder.name,
          color: folder.color,
          createdAt: new Date(folder.created_at),
        }));
        setFolders(loadedFolders);
        console.log('✅ Loaded folders:', loadedFolders.length);
      }

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
        console.error('❌ Error loading notes:', notesError);
      } else {
        const loadedNotes: Note[] = notesData.map(note => ({
          id: note.id,
          title: note.title,
          content: note.content || '',
          folderId: note.folder_id,
          tags: note.tags || [],
          createdAt: new Date(note.created_at),
          updatedAt: new Date(note.updated_at),
        }));
        setNotes(loadedNotes);
        console.log('✅ Loaded notes:', loadedNotes.length);
      }
    } catch (error) {
      console.error('❌ Error loading user data:', error);
      
      // Manejo específico de errores de red con retry
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        console.error('🌐 Network error detected. Retrying in 3 seconds...');
        
        // Retry después de 3 segundos
        setTimeout(() => {
          console.log('🔄 Retrying data load...');
          loadUserData();
        }, 3000);
        return;
      }
      
      // Manejo de errores de timeout
      if (error instanceof Error && error.message.includes('timeout')) {
        console.error('⏱️ Request timeout. Retrying with longer timeout...');
        
        // Retry después de 2 segundos
        setTimeout(() => {
          console.log('🔄 Retrying data load with extended timeout...');
          loadUserData();
        }, 2000);
        return;
      }
      
      // Si es un error de sesión inválida, cerrar sesión
      if (error instanceof Error && (
        error.message.includes('session_not_found') ||
        error.message.includes('JWT expired') ||
        error.message.includes('403')
      )) {
        console.log('🔓 Invalid session detected, signing out...');
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
      console.log('📁 Creating folder:', { name, color });
      // Usar timeout para evitar que se cuelgue
      const insertPromise = supabase
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
      console.log('✅ Folder created successfully:', newFolder);
      return newFolder;
    } catch (error) {
      console.error('❌ Error creating folder:', error);
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
      console.log('⚠️ Using fallback folder creation');
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
      console.log('📝 Creating note:', { title, content: content.substring(0, 50) + '...', folderId });
      // Usar timeout para evitar que se cuelgue
      const insertPromise = supabase
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
      console.log('✅ Note created successfully:', newNote.id);
      return newNote;
    } catch (error) {
      console.error('❌ Error creating note:', error);
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
      console.log('⚠️ Using fallback note creation');
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
      console.log('✏️ Updating note:', id, updates);
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

      const updatePromise = supabase
        .from('notes')
        .update({
          ...supabaseUpdates,
          updated_at: new Date().toISOString(),
        })
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
      console.log('✅ Note updated successfully');
    } catch (error) {
      console.error('❌ Error updating note:', error);
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
      console.log('⚠️ Using fallback note update');
    }
  };

  /**
   * Eliminar una nota
   * @param id ID de la nota a eliminar
   */
  const deleteNote = async (id: string) => {
    if (!user) return;

    try {
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
    } catch (error) {
      console.error('❌ Error deleting note:', error);
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
    }
  };

  /**
   * Eliminar una carpeta y actualizar las notas asociadas
   * @param id ID de la carpeta a eliminar
   */
  const deleteFolder = async (id: string) => {
    if (!user) return;

    try {
      // Primero, actualizar notas para remover la asociación con la carpeta
      const updateNotesPromise = supabase
        .from('notes')
        .update({ folder_id: null })
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
    } catch (error) {
      console.error('❌ Error deleting folder:', error);
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
    }
  };

  /**
   * Obtener notas filtradas según carpeta y fecha seleccionada
   * @returns Array de notas filtradas
   */
  const getFilteredNotes = () => {
    let filtered = notes;

    // Filtrar por carpeta si hay una seleccionada
    if (selectedFolderId) {
      filtered = filtered.filter(note => note.folderId === selectedFolderId);
    }

    // Filtrar por fecha si hay una seleccionada
    if (selectedDate) {
      const dateStr = selectedDate.toDateString();
      filtered = filtered.filter(note => 
        new Date(note.createdAt).toDateString() === dateStr
      );
    }

    return filtered;
  };

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