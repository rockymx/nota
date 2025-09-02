import { useState, useEffect } from 'react';
import { Menu, Plus } from 'lucide-react';
// Componentes principales de la aplicación
import { Sidebar } from './components/Sidebar';
import { NotesList } from './components/NotesList';
import { NoteEditor } from './components/NoteEditor';
import { NoteModal } from './components/NoteModal';
import { AuthForm } from './components/AuthForm';
import { SettingsPage } from './components/SettingsPage';
// Hook personalizado para manejar notas con Supabase
import { useSupabaseNotes } from './hooks/useSupabaseNotes';
import { useAIPrompts } from './hooks/useAIPrompts';
import { geminiService } from './services/geminiService';
import { Note } from './types';

console.log('📱 App component module loading...');
console.log('🔍 Environment check in App:', {
  mode: import.meta.env.MODE,
  prod: import.meta.env.PROD,
  dev: import.meta.env.DEV,
  baseUrl: import.meta.env.BASE_URL
});

function App() {
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
  
  console.log('🎛️ App state initialized');
  
  // Hook que maneja toda la lógica de notas y autenticación
  const {
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
  } = useSupabaseNotes();

  console.log('📊 App data state:', {
    user: user ? `authenticated (${user.email})` : 'not authenticated',
    loading,
    notesCount: notes.length,
    foldersCount: folders.length,
    selectedFolderId,
    selectedDate: selectedDate?.toISOString()
  });

  // Configurar usuario en el servicio de Gemini cuando cambia
  useEffect(() => {
    console.log('🤖 Gemini service setup effect triggered');
    console.log('👤 User for Gemini:', user?.id || 'none');
    if (user) {
      geminiService.setUser(user.id);
      console.log('✅ Gemini service user set');
    } else {
      geminiService.setUser(null);
      console.log('🔄 Gemini service user cleared');
    }
  }, [user]);

  // Hook para manejar prompts de IA
  const {
    prompts: aiPrompts,
    hiddenPromptIds,
    createPrompt,
    updatePrompt,
    deletePrompt,
    hideDefaultPrompt,
    showDefaultPrompt,
  } = useAIPrompts(user);

  console.log('🧠 AI Prompts state:', {
    promptsCount: aiPrompts.length,
    hiddenCount: hiddenPromptIds.size
  });

  // Función para crear una nueva nota
  const handleCreateNote = () => {
    console.log('➕ User action: Creating new note');
    setEditingNote(null);
    setShowEditor(true);
  };

  // Función para editar una nota existente
  const handleEditNote = (note: Note) => {
    console.log('✏️ User action: Editing note', note.id);
    setEditingNote(note);
    setShowEditor(true);
    setViewingNote(null);
  };

  // Función para ver una nota en modal
  const handleViewNote = (note: Note) => {
    console.log('👁️ User action: Viewing note', note.id);
    setViewingNote(note);
  };

  // Función para guardar una nota (nueva o editada)
  const handleSaveNote = async (title: string, content: string, folderId: string | null) => {
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
  };

  // Mostrar pantalla de carga mientras se verifica la autenticación
  if (loading) {
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

  // Mostrar formulario de autenticación si no está logueado
  if (!user) {
    console.log('🔐 Rendering auth form (user not authenticated)');
    return <AuthForm onSuccess={() => {}} />;
  }

  console.log('🎨 Rendering main app interface for authenticated user');
  
  // Obtener notas filtradas según carpeta y fecha seleccionada
  const filteredNotes = getFilteredNotes();
  console.log('🔍 Filtered notes for display:', {
    total: notes.length,
    filtered: filteredNotes.length,
    selectedFolder: selectedFolderId,
    selectedDate: selectedDate?.toDateString()
  });

  console.log('🎯 About to render main app JSX...');
  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Barra lateral con carpetas y calendario */}
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        user={user}
        folders={folders}
        selectedFolderId={selectedFolderId}
        selectedDate={selectedDate}
        onFolderSelect={setSelectedFolderId}
        onDateSelect={setSelectedDate}
        onCreateFolder={createFolder}
        onDeleteFolder={deleteFolder}
        onShowSettings={() => setShowSettings(true)}
      />

      {/* Contenido principal */}
      <div className="flex-1 flex flex-col">
        {/* Área de contenido - Editor o Lista de notas */}
        <main className="flex-1 overflow-hidden relative">
          {/* Botón de menú hamburguesa flotante para móvil */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="fixed top-4 left-4 z-30 p-3 bg-white rounded-lg shadow-lg hover:bg-gray-50 transition-colors lg:hidden"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Botón flotante para crear nueva nota */}
          <button
            onClick={handleCreateNote}
            className="fixed bottom-6 right-6 z-30 bg-blue-500 hover:bg-blue-600 text-white p-4 rounded-full shadow-lg transition-colors flex items-center gap-2"
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
              user={user}
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
    </div>
  );
}

console.log('✅ App component definition completed');
export default App;