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

console.log('📱 App component loading...');

function App() {
  console.log('🔧 App component initializing...');
  
  // Estados para controlar la interfaz
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [viewingNote, setViewingNote] = useState<Note | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  
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

  console.log('👤 User state:', user ? 'authenticated' : 'not authenticated');
  console.log('⏳ Loading state:', loading);
  console.log('📝 Notes count:', notes.length);
  console.log('📁 Folders count:', folders.length);

  // Configurar usuario en el servicio de Gemini cuando cambia
  useEffect(() => {
    console.log('🤖 Setting up Gemini service for user:', user?.id || 'none');
    if (user) {
      geminiService.setUser(user.id);
    } else {
      geminiService.setUser(null);
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

  console.log('🧠 AI Prompts count:', aiPrompts.length);

  // Función para crear una nueva nota
  const handleCreateNote = () => {
    console.log('➕ Creating new note...');
    setEditingNote(null);
    setShowEditor(true);
  };

  // Función para editar una nota existente
  const handleEditNote = (note: Note) => {
    console.log('✏️ Editing note:', note.id);
    setEditingNote(note);
    setShowEditor(true);
    setViewingNote(null);
  };

  // Función para ver una nota en modal
  const handleViewNote = (note: Note) => {
    console.log('👁️ Viewing note:', note.id);
    setViewingNote(note);
  };

  // Función para guardar una nota (nueva o editada)
  const handleSaveNote = async (title: string, content: string, folderId: string | null) => {
    console.log('💾 Saving note:', { title, folderId, contentLength: content.length });
    if (editingNote) {
      // Actualizar nota existente
      await updateNote(editingNote.id, { title, content, folderId });
    } else {
      // Crear nueva nota
      await createNote(title, content, folderId);
    }
    setShowEditor(false);
    setEditingNote(null);
  };

  // Mostrar pantalla de carga mientras se verifica la autenticación
  if (loading) {
    console.log('⏳ Showing loading screen...');
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  // Mostrar formulario de autenticación si no está logueado
  if (!user) {
    console.log('🔐 Showing auth form...');
    return <AuthForm onSuccess={() => {}} />;
  }

  console.log('🎨 Rendering main app interface...');
  
  // Obtener notas filtradas según carpeta y fecha seleccionada
  const filteredNotes = getFilteredNotes();
  console.log('🔍 Filtered notes count:', filteredNotes.length);

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

export default App;