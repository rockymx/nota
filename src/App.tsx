import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Menu, Plus } from 'lucide-react';
import { User } from '@supabase/supabase-js';
import { ErrorBoundary } from './components/ErrorBoundary';
// Componentes principales de la aplicación
import { Sidebar } from './components/Sidebar';
import { NotesList } from './components/NotesList';
import { NoteEditor } from './components/NoteEditor';
import { NoteModal } from './components/NoteModal';
import { SettingsPage } from './components/SettingsPage';
// Hooks especializados optimizados
import { useNotes } from './hooks/useNotes';
import { useFolders } from './hooks/useFolders';
import { useNotesFilter } from './hooks/useNotesFilter';
import { useAIPrompts } from './hooks/useAIPrompts';
import { useToast } from './hooks/useToast';
import { ToastContainer } from './components/ToastContainer';
import { useErrorHandler } from './hooks/useErrorHandler';
import { geminiService } from './services/geminiService';
import { Note } from './types';
import { cacheUtils } from './lib/queryClient';

console.log('📱 App component module loading...');
console.log('🔍 Environment check in App:', {
  mode: import.meta.env.MODE,
  prod: import.meta.env.PROD,
  dev: import.meta.env.DEV,
  baseUrl: import.meta.env.BASE_URL
});

interface AppProps {
  user?: User;
  onGoToAdmin?: () => void;
}

function App({ user, onGoToAdmin }: AppProps) {
  console.log('🔧 App component function executing...');
  console.log('🔍 Runtime environment check:', {
    userAgent: navigator.userAgent,
    location: window.location.href,
    origin: window.location.origin
  });

  // Estados para controlar la interfaz
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [viewingNote, setViewingNote] = useState<Note | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showAdminSetup, setShowAdminSetup] = useState(false);
  const { toasts, removeToast } = useToast();
  const errorHandler = useErrorHandler();
  console.log('🎛️ App state initialized');

  // Hooks especializados separados
  const isAuthenticated = !!user;
  const authLoading = false;
  const { notes, loading: notesLoading, createNote, updateNote, deleteNote } = useNotes(user || null);
  const { folders, loading: foldersLoading, createFolder, deleteFolder, restoreFolder } = useFolders(user || null);
  const {
    filteredNotes,
    selectedFolderId,
    selectedDate,
    handleFolderSelect,
    handleDateSelect,
    filterStats,
  } = useNotesFilter(notes);

  console.log('📊 App data state:', {
    user: user ? `authenticated (${user.email})` : 'not authenticated',
    authLoading,
    notesLoading,
    foldersLoading,
    notesCount: notes.length,
    foldersCount: folders.length,
    selectedFolderId,
    selectedDate: selectedDate?.toISOString(),
    filteredCount: filteredNotes.length
  });

  // Configurar usuario en el servicio de Gemini cuando cambia
  useEffect(() => {
    console.log('🤖 Gemini service setup effect triggered');
    console.log('👤 User for Gemini:', user?.id || 'none');
    
    // Configurar error handler en Gemini service
    geminiService.setErrorHandler(errorHandler);
    
    if (user) {
      geminiService.setUser(user.id);
      console.log('✅ Gemini service user set');
    } else {
      geminiService.setUser(null);
      console.log('🔄 Gemini service user cleared');
    }
  }, [user, errorHandler]);

  // Limpiar cache cuando el usuario se desconecta
  useEffect(() => {
    if (!user && !authLoading) {
      console.log('🧹 Clearing user cache on logout...');
      // Clear cache for any previous user
      cacheUtils.clearUserCache('*');
    }
  }, [user, authLoading]);

  // Hook para manejar prompts de IA
  const {
    prompts: aiPrompts,
    hiddenPromptIds,
    createPrompt,
    updatePrompt,
    deletePrompt,
    hideDefaultPrompt,
    showDefaultPrompt,
  } = useAIPrompts(user || null);

  console.log('🧠 AI Prompts state:', {
    promptsCount: aiPrompts.length,
    hiddenCount: hiddenPromptIds.size
  });

  // Función para crear una nueva nota
  const handleCreateNote = useCallback(() => {
    console.log('➕ User action: Creating new note');
    setEditingNote(null);
    setShowEditor(true);
  }, []);

  // Función para editar una nota existente
  const handleEditNote = useCallback((note: Note) => {
    console.log('✏️ User action: Editing note', note.id);
    setEditingNote(note);
    setShowEditor(true);
    setViewingNote(null);
  }, []);

  // Función para ver una nota en modal
  const handleViewNote = useCallback((note: Note) => {
    console.log('👁️ User action: Viewing note', note.id);
    setViewingNote(note);
  }, []);

  // Función para guardar una nota (nueva o editada)
  const handleSaveNote = useCallback(async (title: string, content: string, folderId: string | null) => {
    console.log('💾 User action: Saving note', { 
      title, 
      folderId, 
      contentLength: content.length,
      isEditing: !!editingNote 
    });
    
    if (editingNote) {
      // Actualizar nota existente
      console.log('🔄 Updating existing note:', editingNote.id);
      await updateNote(editingNote.id, { title, content, folderId });
    } else {
      // Crear nueva nota
      console.log('➕ Creating new note');
      await createNote(title, content, folderId);
    }
    
    console.log('✅ Note save operation completed');
    setShowEditor(false);
    setEditingNote(null);
  }, [editingNote, updateNote, createNote]);

  // Callbacks optimizados para el sidebar
  const optimizedFolderSelect = useCallback((folderId: string | null) => {
    handleFolderSelect(folderId);
    // Si estamos en configuración, volver a la vista principal
    if (showSettings) {
      setShowSettings(false);
    }
    // Cerrar sidebar en móvil después de seleccionar
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  }, [handleFolderSelect, showSettings]);

  const optimizedDateSelect = useCallback((date: Date | null) => {
    handleDateSelect(date);
    // Si estamos en configuración, volver a la vista principal
    if (showSettings) {
      setShowSettings(false);
    }
    // Cerrar sidebar en móvil después de seleccionar
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  }, [handleDateSelect, showSettings]);

  // Mostrar pantalla de carga mientras se verifica la autenticación
  const isLoading = authLoading || (isAuthenticated && (notesLoading || foldersLoading));
  
  if (isLoading) {
    console.log('⏳ Rendering loading screen...');
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Cargando NotesApp...</p>
          <p className="text-xs text-gray-500 mt-2">Verificando autenticación...</p>
        </div>
      </div>
    );
  }

  console.log('🎨 Rendering main app interface for authenticated user');
  
  // Obtener notas filtradas según carpeta y fecha seleccionada
  console.log('🔍 Filtered notes for display:', {
    total: notes.length,
    filtered: filteredNotes.length,
    selectedFolder: selectedFolderId,
    selectedDate: selectedDate?.toDateString()
  });

  console.log('🎯 About to render main app JSX...');
  return (
    <ErrorBoundary>
      <div className="flex h-screen bg-app transition-colors duration-300">
        {/* Barra lateral con carpetas y calendario */}
        <Sidebar
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
          folders={folders}
          notes={notes}
          selectedFolderId={selectedFolderId}
          selectedDate={selectedDate}
          onFolderSelect={optimizedFolderSelect}
          onDateSelect={optimizedDateSelect}
          onCreateFolder={createFolder}
          onDeleteFolder={deleteFolder}
          onRestoreFolder={restoreFolder}
          onShowSettings={() => setShowSettings(true)}
          onShowAdmin={onGoToAdmin}
        />

        {/* Contenido principal */}
        <div className="flex-1 flex flex-col">
          {/* Área de contenido - Editor o Lista de notas */}
          <main className="flex-1 overflow-hidden relative bg-app">
            {/* Botón de menú hamburguesa flotante para móvil */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="fixed top-4 left-4 z-30 p-3 bg-app rounded-lg shadow-app-lg hover:bg-app-secondary transition-all duration-200 lg:hidden border border-app"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Botón flotante para crear nueva nota */}
            <button
              onClick={handleCreateNote}
              className="fixed bottom-6 right-6 z-30 bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white p-4 rounded-full shadow-app-lg transition-all duration-200 flex items-center gap-2 hover:scale-105"
            >
              <Plus className="w-6 h-6" />
            </button>

            {showEditor ? (
              <NoteEditor
                note={editingNote}
                folders={folders}
                aiPrompts={aiPrompts}
                hiddenPromptIds={hiddenPromptIds}
                onSave={handleSaveNote}
                onClose={() => setShowEditor(false)}
              />
            ) : showSettings ? (
              <SettingsPage
                user={user!}
                onBack={() => setShowSettings(false)}
                totalNotes={notes.length}
                totalFolders={folders.length}
                aiPrompts={aiPrompts}
                hiddenPromptIds={hiddenPromptIds}
                onCreatePrompt={createPrompt}
                onUpdatePrompt={updatePrompt}
                onDeletePrompt={deletePrompt}
                onHideDefaultPrompt={hideDefaultPrompt}
                onShowDefaultPrompt={showDefaultPrompt}
              />
            ) : (
              <NotesList
                notes={filteredNotes}
                folders={folders}
                onEditNote={handleEditNote}
                onDeleteNote={deleteNote}
                onViewNote={handleViewNote}
              />
            )}
          </main>
        </div>

        {/* Modal para ver nota */}
        {viewingNote && (
          <NoteModal
            note={viewingNote}
            folders={folders}
            onClose={() => setViewingNote(null)}
            onEdit={handleEditNote}
          />
        )}

        {/* Sistema de toasts */}
        <ToastContainer
          toasts={toasts}
          onDismiss={removeToast}
        />
      </div>
    </ErrorBoundary>
  );
}

console.log('✅ App component definition completed');
export default App;