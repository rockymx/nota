import { useMemo } from 'react';
import { Note } from '../types';

/**
 * Hook para manejar hashtags extraídos automáticamente del contenido de las notas
 */
export function useHashtags(notes: Note[]) {
  // Extraer hashtags de una nota específica
  const extractHashtagsFromContent = (content: string): string[] => {
    if (!content) return [];
    
    // Regex para detectar hashtags: # seguido de letras, números, guiones y guiones bajos
    const hashtagRegex = /#([a-zA-ZáéíóúñÁÉÍÓÚÑ0-9_-]+)/g;
    const matches = content.match(hashtagRegex);
    
    if (!matches) return [];
    
    // Limpiar hashtags: remover # y convertir a minúsculas
    return matches
      .map(tag => tag.slice(1).toLowerCase())
      .filter(tag => tag.length > 0);
  };

  // Obtener todos los hashtags únicos con su frecuencia
  const allHashtags = useMemo(() => {
    const hashtagCount = new Map<string, number>();
    const hashtagNotes = new Map<string, Note[]>();

    notes.forEach(note => {
      const hashtags = extractHashtagsFromContent(note.content);
      
      hashtags.forEach(hashtag => {
        // Contar frecuencia
        hashtagCount.set(hashtag, (hashtagCount.get(hashtag) || 0) + 1);
        
        // Asociar notas con hashtags
        if (!hashtagNotes.has(hashtag)) {
          hashtagNotes.set(hashtag, []);
        }
        hashtagNotes.get(hashtag)!.push(note);
      });
    });

    // Convertir a array y ordenar por frecuencia
    return Array.from(hashtagCount.entries())
      .map(([hashtag, count]) => ({
        hashtag,
        count,
        notes: hashtagNotes.get(hashtag) || []
      }))
      .sort((a, b) => b.count - a.count);
  }, [notes]);

  // Filtrar notas por hashtag específico
  const filterNotesByHashtag = (hashtag: string): Note[] => {
    return notes.filter(note => {
      const noteHashtags = extractHashtagsFromContent(note.content);
      return noteHashtags.includes(hashtag.toLowerCase());
    });
  };

  // Verificar si una nota contiene un hashtag específico
  const noteHasHashtag = (note: Note, hashtag: string): boolean => {
    const noteHashtags = extractHashtagsFromContent(note.content);
    return noteHashtags.includes(hashtag.toLowerCase());
  };

  // Obtener hashtags de una nota específica
  const getHashtagsFromNote = (note: Note): string[] => {
    return extractHashtagsFromContent(note.content);
  };

  return {
    allHashtags,
    extractHashtagsFromContent,
    filterNotesByHashtag,
    noteHasHashtag,
    getHashtagsFromNote,
  };
}
</parameter>
</invoke>
<invoke name="file">
<parameter name="filePath">src/components/HashtagCloud.tsx</parameter>
<parameter name="contentType">content</parameter>
<parameter name="content">import { Hash, X } from 'lucide-react';

interface HashtagData {
  hashtag: string;
  count: number;
  notes: any[];
}

interface HashtagCloudProps {
  hashtags: HashtagData[];
  selectedHashtag: string | null;
  onHashtagSelect: (hashtag: string | null) => void;
}

export function HashtagCloud({ hashtags, selectedHashtag, onHashtagSelect }: HashtagCloudProps) {
  // Colores para los hashtags basados en frecuencia
  const getHashtagColor = (count: number, maxCount: number) => {
    const intensity = Math.min(count / maxCount, 1);
    
    if (intensity > 0.7) return 'bg-blue-100 text-blue-800 border-blue-200';
    if (intensity > 0.4) return 'bg-green-100 text-green-800 border-green-200';
    if (intensity > 0.2) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const maxCount = Math.max(...hashtags.map(h => h.count), 1);

  if (hashtags.length === 0) {
    return (
      <div className="text-center py-6 text-app-secondary">
        <Hash className="w-6 h-6 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No hay hashtags</p>
        <p className="text-xs mt-1">Usa #hashtag en tus notas</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header con filtro activo */}
      {selectedHashtag && (
        <div className="flex items-center justify-between p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-700">
          <div className="flex items-center gap-2">
            <Hash className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
              #{selectedHashtag}
            </span>
          </div>
          <button
            onClick={() => onHashtagSelect(null)}
            className="p-1 rounded hover:bg-blue-100 dark:hover:bg-blue-800/50 transition-colors"
          >
            <X className="w-3 h-3 text-blue-600" />
          </button>
        </div>
      )}

      {/* Nube de hashtags */}
      <div className="flex flex-wrap gap-2">
        {hashtags.map(({ hashtag, count }) => (
          <button
            key={hashtag}
            onClick={() => onHashtagSelect(selectedHashtag === hashtag ? null : hashtag)}
            className={`
              inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border transition-all duration-200 hover:scale-105
              ${selectedHashtag === hashtag
                ? 'bg-blue-500 text-white border-blue-500 shadow-md'
                : `${getHashtagColor(count, maxCount)} hover:shadow-sm`
              }
            `}
            title={`${count} nota${count > 1 ? 's' : ''} con #${hashtag}`}
          >
            <Hash className="w-3 h-3" />
            <span>{hashtag}</span>
            <span className={`
              text-xs px-1 rounded-full
              ${selectedHashtag === hashtag
                ? 'bg-white/20 text-white'
                : 'bg-black/10'
              }
            `}>
              {count}
            </span>
          </button>
        ))}
      </div>

      {/* Estadísticas */}
      <div className="text-xs text-app-tertiary pt-2 border-t border-app">
        {hashtags.length} hashtag{hashtags.length !== 1 ? 's' : ''} encontrado{hashtags.length !== 1 ? 's' : ''}
      </div>
    </div>
  );
}
</parameter>
</invoke>
<invoke name="file">
<parameter name="filePath">src/components/Sidebar.tsx</parameter>
<parameter name="contentType">diff</parameter>
<parameter name="content">@@ .. @@
 import { useState } from 'react';
-import { X, Plus, Calendar, Folder, Settings } from 'lucide-react';
+import { X, Plus, Calendar, Folder, Settings, Hash } from 'lucide-react';
 import { FolderList } from './FolderList';
 import { CalendarView } from './CalendarView';
 import { CreateFolderModal } from './CreateFolderModal';
+import { HashtagCloud } from './HashtagCloud';
+import { useHashtags } from '../hooks/useHashtags';
 import { Folder as FolderType, Note } from '../types';
@@ .. @@
 interface SidebarProps {
   isOpen: boolean;
   onToggle: () => void;
   folders: FolderType[];
   notes: Note[];
   selectedFolderId: string | null;
   selectedDate: Date | null;
+  selectedHashtag: string | null;
   onFolderSelect: (folderId: string | null) => void;
   onDateSelect: (date: Date | null) => void;
+  onHashtagSelect: (hashtag: string | null) => void;
   onCreateFolder: (name: string, color: string) => Promise<FolderType | null>;
   onDeleteFolder: (id: string) => void;
   onShowSettings: () => void;
 }
@@ .. @@
 export function Sidebar({
   isOpen,
   onToggle,
   folders,
   notes,
   selectedFolderId,
   selectedDate,
+  selectedHashtag,
   onFolderSelect,
   onDateSelect,
+  onHashtagSelect,
   onCreateFolder,
   onDeleteFolder,
   onShowSettings,
 }: SidebarProps) {
   // Estados para controlar la vista activa y modales
-  const [activeView, setActiveView] = useState<'folders' | 'calendar'>('folders');
+  const [activeView, setActiveView] = useState<'folders' | 'calendar' | 'hashtags'>('folders');
   const [showCreateFolder, setShowCreateFolder] = useState(false);
+
+  // Hook para manejar hashtags
+  const { allHashtags } = useHashtags(notes);
@@ .. @@
         {/* Navegación entre vistas (Carpetas/Calendario) */}
         <div className="p-4 relative">
           {/* Botón de cerrar para móvil */}
           <button
             onClick={onToggle}
             className="absolute top-2 right-2 p-2 rounded-lg hover:bg-app-secondary transition-colors lg:hidden z-10"
           >
             <X className="w-5 h-5 text-app-secondary" />
           </button>
 
-          <div className="flex bg-app-secondary rounded-lg p-1 mb-4">
+          <div className="grid grid-cols-3 bg-app-secondary rounded-lg p-1 mb-4">
             <button
               onClick={() => setActiveView('folders')}
               className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                 activeView === 'folders'
                   ? 'bg-app text-blue-600 shadow-app-sm'
                   : 'text-app-secondary hover:text-app-primary'
               }`}
             >
               <Folder className="w-4 h-4" />
-              Notas
+              <span className="hidden sm:inline">Notas</span>
             </button>
             <button
               onClick={() => setActiveView('calendar')}
               className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                 activeView === 'calendar'
                   ? 'bg-app text-blue-600 shadow-app-sm'
                   : 'text-app-secondary hover:text-app-primary'
               }`}
             >
               <Calendar className="w-4 h-4" />
-              Calendario
+              <span className="hidden sm:inline">Calendario</span>
+            </button>
+            <button
+              onClick={() => setActiveView('hashtags')}
+              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
+                activeView === 'hashtags'
+                  ? 'bg-app text-blue-600 shadow-app-sm'
+                  : 'text-app-secondary hover:text-app-primary'
+              }`}
+            >
+              <Hash className="w-4 h-4" />
+              <span className="hidden sm:inline">Tags</span>
             </button>
           </div>
@@ .. @@
           {/* Contenido según la vista activa */}
           <div className="space-y-4">
             {activeView === 'folders' && (
               <>
                 <div className="flex items-center justify-between">
                   <h3 className="text-sm font-medium text-app-primary">Organizar por carpetas</h3>
                   <button
                     onClick={() => setShowCreateFolder(true)}
                     className="p-1 rounded hover:bg-app-secondary transition-colors"
                   >
                     <Plus className="w-4 h-4 text-app-secondary" />
                   </button>
                 </div>
                 <FolderList
                   folders={folders}
                   selectedFolderId={selectedFolderId}
                   onFolderSelect={onFolderSelect}
                   onDeleteFolder={onDeleteFolder}
                 />
               </>
             )}
 
             {activeView === 'calendar' && (
               <>
                 <h3 className="text-sm font-medium text-app-primary">Filtrar por fecha</h3>
                 <CalendarView
                   selectedDate={selectedDate}
                   onDateSelect={onDateSelect}
                   notes={notes}
                 />
               </>
             )}
+
+            {activeView === 'hashtags' && (
+              <>
+                <h3 className="text-sm font-medium text-app-primary">Filtrar por hashtags</h3>
+                <HashtagCloud
+                  hashtags={allHashtags}
+                  selectedHashtag={selectedHashtag}
+                  onHashtagSelect={onHashtagSelect}
+                />
+              </>
+            )}
           </div>
         </div>
@@ .. @@
</parameter>
</invoke>
<invoke name="file">
<parameter name="filePath">src/App.tsx</parameter>
<parameter name="contentType">diff</parameter>
<parameter name="content">@@ .. @@
 import { useSupabaseNotes } from './hooks/useSupabaseNotes';
 import { useAIPrompts } from './hooks/useAIPrompts';
+import { useHashtags } from './hooks/useHashtags';
 import { geminiService } from './services/geminiService';
 import { Note } from './types';
@@ .. @@
   const [viewingNote, setViewingNote] = useState<Note | null>(null);
   const [showSettings, setShowSettings] = useState(false);
+  const [selectedHashtag, setSelectedHashtag] = useState<string | null>(null);
   
   console.log('🎛️ App state initialized');
@@ .. @@
   } = useAIPrompts(user);
 
+  // Hook para manejar hashtags
+  const { filterNotesByHashtag } = useHashtags(notes);
+
   console.log('🧠 AI Prompts state:', {
     promptsCount: aiPrompts.length,
     hiddenCount: hiddenPromptIds.size
@@ .. @@
   // Obtener notas filtradas según carpeta y fecha seleccionada
   const filteredNotes = getFilteredNotes();
+  
+  // Aplicar filtro adicional por hashtag si está seleccionado
+  const finalFilteredNotes = selectedHashtag 
+    ? filteredNotes.filter(note => {
+        const noteHashtags = note.content.match(/#([a-zA-ZáéíóúñÁÉÍÓÚÑ0-9_-]+)/g);
+        if (!noteHashtags) return false;
+        const cleanHashtags = noteHashtags.map(tag => tag.slice(1).toLowerCase());
+        return cleanHashtags.includes(selectedHashtag.toLowerCase());
+      })
+    : filteredNotes;
+
   console.log('🔍 Filtered notes for display:', {
     total: notes.length,
-    filtered: filteredNotes.length,
+    filtered: finalFilteredNotes.length,
     selectedFolder: selectedFolderId,
-    selectedDate: selectedDate?.toDateString()
+    selectedDate: selectedDate?.toDateString(),
+    selectedHashtag
   });
@@ .. @@
         folders={folders}
         notes={notes}
         selectedFolderId={selectedFolderId}
         selectedDate={selectedDate}
+        selectedHashtag={selectedHashtag}
         onFolderSelect={(folderId) => {
           setSelectedFolderId(folderId);
+          // Limpiar filtro de hashtag al seleccionar carpeta
+          setSelectedHashtag(null);
           // Si estamos en configuración, volver a la vista principal
           if (showSettings) {
             setShowSettings(false);
@@ -142,6 +165,7 @@ function App() {
         }}
         onDateSelect={(date) => {
           setSelectedDate(date);
+          // Limpiar filtro de hashtag al seleccionar fecha
+          setSelectedHashtag(null);
           // Si estamos en configuración, volver a la vista principal
           if (showSettings) {
             setShowSettings(false);
@@ -152,6 +176,18 @@ function App() {
             setSidebarOpen(false);
           }
         }}
+        onHashtagSelect={(hashtag) => {
+          setSelectedHashtag(hashtag);
+          // Limpiar otros filtros al seleccionar hashtag
+          setSelectedFolderId(null);
+          setSelectedDate(null);
+          // Si estamos en configuración, volver a la vista principal
+          if (showSettings) {
+            setShowSettings(false);
+          }
+          // Cerrar sidebar en móvil después de seleccionar
+          if (window.innerWidth < 1024) {
+            setSidebarOpen(false);
+          }
+        }}
         onCreateFolder={createFolder}
         onDeleteFolder={deleteFolder}
         onShowSettings={() => setShowSettings(true)}
@@ .. @@
           ) : (
             <NotesList
-              notes={filteredNotes}
+              notes={finalFilteredNotes}
               folders={folders}
               onEditNote={handleEditNote}
               onDeleteNote={deleteNote}
@@ .. @@
</parameter>
</invoke>
<invoke name="file">
<parameter name="filePath">src/hooks/useSupabaseNotes.ts</parameter>
<parameter name="contentType">diff</parameter>
<parameter name="content">@@ .. @@
 import { useState, useEffect } from 'react';
 import { supabase } from '../lib/supabase';
 import { Note, Folder } from '../types';
 import { User } from '@supabase/supabase-js';
+import { useHashtags } from './useHashtags';
 
 /**
  * Hook personalizado para manejar notas y carpetas con Supabase
@@ -18,6 +19,9 @@ export function useSupabaseNotes() {
   const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
   const [selectedDate, setSelectedDate] = useState<Date | null>(null);
 
+  // Hook para extraer hashtags automáticamente
+  const { extractHashtagsFromContent } = useHashtags(notes);
+
   // Gestión del estado de autenticación
   useEffect(() => {
     console.log('🔐 useSupabaseNotes: Auth effect triggered');
@@ .. @@
   const createNote = async (title: string, content: string, folderId: string | null = null) => {
     if (!user) return null;
 
+    // Extraer hashtags automáticamente del contenido
+    const extractedHashtags = extractHashtagsFromContent(content);
+
     try {
       console.log('📝 createNote called:', { 
         title, 
         contentLength: content.length,
         contentPreview: content.substring(0, 50) + '...', 
         folderId,
+        extractedHashtags,
         userId: user.id 
       });
       
@@ -200,6 +209,7 @@ export function useSupabaseNotes() {
           title,
           content,
           folder_id: folderId,
+          tags: extractedHashtags,
           user_id: user.id,
         })
         .select('*')
@@ .. @@
         id: (data as any).id,
         title: (data as any).title,
         content: (data as any).content || '',
         folderId: (data as any).folder_id,
-        tags: (data as any).tags || [],
+        tags: extractedHashtags,
         createdAt: new Date((data as any).created_at),
         updatedAt: new Date((data as any).updated_at),
       };
@@ .. @@
   const updateNote = async (id: string, updates: Partial<Note>) => {
     if (!user) return;
 
+    // Si se está actualizando el contenido, extraer hashtags automáticamente
+    let finalUpdates = { ...updates };
+    if (updates.content !== undefined) {
+      const extractedHashtags = extractHashtagsFromContent(updates.content);
+      finalUpdates.tags = extractedHashtags;
+    }
+
     try {
       console.log('✏️ updateNote called:', { 
         noteId: id, 
-        updates,
+        updates: finalUpdates,
         userId: user.id 
       });
       
       // Mapear folderId a folder_id para Supabase
-      const supabaseUpdates: any = { ...updates };
-      if ('folderId' in updates) {
-        supabaseUpdates.folder_id = updates.folderId;
+      const supabaseUpdates: any = { ...finalUpdates };
+      if ('folderId' in finalUpdates) {
+        supabaseUpdates.folder_id = finalUpdates.folderId;
         delete supabaseUpdates.folderId;
       }
       // Remover campos que no existen en la base de datos
@@ .. @@
       if (error) throw error;
 
       setNotes(prev => prev.map(note => 
         note.id === id 
-          ? { ...note, ...updates, updatedAt: new Date() }
+          ? { ...note, ...finalUpdates, updatedAt: new Date() }
           : note
       ));
       console.log('✅ Note updated successfully:', id);
@@ .. @@
       // Actualizar localmente como fallback
       setNotes(prev => prev.map(note => 
         note.id === id 
-          ? { ...note, ...updates, updatedAt: new Date() }
+          ? { ...note, ...finalUpdates, updatedAt: new Date() }
           : note
       ));
       console.log('⚠️ Using fallback note update due to error');
@@ .. @@
</parameter>
</invoke>
<invoke name="file">
<parameter name="filePath">src/components/NotesList.tsx</parameter>
<parameter name="contentType">diff</parameter>
<parameter name="content">@@ .. @@
 import { Note, Folder as FolderType } from '../types';
 import { format } from 'date-fns';
 import { es } from 'date-fns/locale';
 import { MarkdownRenderer } from './MarkdownRenderer';
-import { Edit3, Trash2, Calendar } from 'lucide-react';
+import { Edit3, Trash2, Calendar, Hash } from 'lucide-react';
+import { useHashtags } from '../hooks/useHashtags';
 
 /**
  * Componente que muestra la lista de notas en formato de tarjetas
@@ -18,6 +20,9 @@ export function NotesList({ notes, folders, onEditNote, onDeleteNote, onViewNot
   // Función auxiliar para obtener carpeta por ID
   const getFolderById = (id: string | null) => {
     return folders.find(folder => folder.id === id);
   };
+
+  // Hook para extraer hashtags
+  const { getHashtagsFromNote } = useHashtags(notes);
 
   // Mostrar mensaje cuando no hay notas
@@ .. @@
   return (
     <div className="grid gap-4 p-4">
       {notes.map((note) => {
         const folder = getFolderById(note.folderId);
+        const noteHashtags = getHashtagsFromNote(note);
         
         return (
           <div 
@@ .. @@
             {/* Información adicional: carpeta y fecha */}
             <div className="flex items-center justify-between text-xs text-app-tertiary">
               <div className="flex items-center gap-4">
                 {/* Mostrar carpeta si existe */}
                 {folder && (
                   <div className="flex items-center gap-1">
                     <div
                       className="w-3 h-3 rounded-full"
                       style={{ backgroundColor: folder.color }}
                     />
                     <span>{folder.name}</span>
                   </div>
                 )}
                 {/* Fecha de creación */}
                 <div className="flex items-center gap-1">
                   <Calendar className="w-3 h-3" />
                   <span>{format(new Date(note.createdAt), 'dd MMM yyyy', { locale: es })}</span>
                 </div>
               </div>
+              
+              {/* Mostrar hashtags si existen */}
+              {noteHashtags.length > 0 && (
+                <div className="flex items-center gap-1">
+                  <Hash className="w-3 h-3" />
+                  <span className="text-xs">
+                    {noteHashtags.slice(0, 2).map(tag => `#${tag}`).join(' ')}
+                    {noteHashtags.length > 2 && ` +${noteHashtags.length - 2}`}
+                  </span>
+                </div>
+              )}
             </div>
           </div>
         );
@@ .. @@
</parameter>
</invoke>
<invoke name="file">
<parameter name="filePath">src/components/NoteEditor.tsx</parameter>
<parameter name="contentType">diff</parameter>
<parameter name="content">@@ .. @@
 import { Save, X } from 'lucide-react';
 import { Note, Folder } from '../types';
 import { AIPrompt } from '../types';
 import { geminiService } from '../services/geminiService';
 import { PromptSelector } from './PromptSelector';
 import { MarkdownRenderer } from './MarkdownRenderer';
+import { useHashtags } from '../hooks/useHashtags';
 
 /**
  * Componente para editar y crear notas
@@ -21,6 +22,9 @@ export function NoteEditor({ note, folders, aiPrompts, hiddenPromptIds, onSave,
   const [aiError, setAiError] = useState('');
   const [showPreview, setShowPreview] = useState(false);
 
+  // Hook para extraer hashtags
+  const { extractHashtagsFromContent } = useHashtags([]);
+
   // Cargar datos de la nota cuando cambia
   useEffect(() => {
     if (note) {
@@ -35,6 +39,10 @@ export function NoteEditor({ note, folders, aiPrompts, hiddenPromptIds, onSave,
     }
   }, [note]);
 
+  // Extraer hashtags del contenido actual
+  const currentHashtags = extractHashtagsFromContent(content);
+  const hashtagsText = currentHashtags.length > 0 ? currentHashtags.map(tag => `#${tag}`).join(' ') : '';
+
   // Función para guardar la nota
   const handleSave = () => {
     if (title.trim() || content.trim()) {
@@ -140,7 +148,7 @@ export function NoteEditor({ note, folders, aiPrompts, hiddenPromptIds, onSave,
           <div className="text-xs text-app-tertiary">
             Usa **texto** para negritas, *texto* para cursivas
           </div>
+          {/* Mostrar hashtags detectados */}
+          {hashtagsText && (
+            <div className="text-xs text-blue-600 dark:text-blue-400">
+              Hashtags: {hashtagsText}
+            </div>
+          )}
         </div>
       </div>
       {/* Área de edición de texto */}
@@ -168,7 +176,7 @@ export function NoteEditor({ note, folders, aiPrompts, hiddenPromptIds, onSave,
         ) : (
           <textarea
             value={content}
             onChange={(e) => setContent(e.target.value)}
-            placeholder="Escribe tu nota aquí...&#10;&#10;Usa **texto** para negritas&#10;Usa *texto* para cursivas&#10;Usa # para títulos&#10;Usa - para listas"
+            placeholder="Escribe tu nota aquí...&#10;&#10;Usa **texto** para negritas&#10;Usa *texto* para cursivas&#10;Usa # para títulos&#10;Usa - para listas&#10;Usa #hashtag para etiquetar"
             className="w-full h-full resize-none border-none outline-none text-app-primary placeholder-app-tertiary leading-relaxed bg-transparent"
             onKeyDown={handleKeyDown}
           />
@@ .. @@
</parameter>
</invoke>