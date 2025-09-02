import { useState } from 'react';
import { Note, Folder } from '../types';
import { useLocalStorage } from './useLocalStorage';

export function useNotes() {
  const [notes, setNotes] = useLocalStorage<Note[]>('notes', []);
  const [folders, setFolders] = useLocalStorage<Folder[]>('folders', []);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const createNote = (title: string, content: string, folderId: string | null = null) => {
    const newNote: Note = {
      id: crypto.randomUUID(),
      title,
      content,
      folderId,
      createdAt: new Date(),
      updatedAt: new Date(),
      tags: [],
    };
    setNotes(prev => [newNote, ...prev]);
    return newNote;
  };

  const updateNote = (id: string, updates: Partial<Note>) => {
    setNotes(prev => prev.map(note => 
      note.id === id 
        ? { ...note, ...updates, updatedAt: new Date() }
        : note
    ));
  };

  const deleteNote = (id: string) => {
    setNotes(prev => prev.filter(note => note.id !== id));
  };

  const createFolder = (name: string, color: string) => {
    const newFolder: Folder = {
      id: crypto.randomUUID(),
      name,
      color,
      createdAt: new Date(),
    };
    setFolders(prev => [...prev, newFolder]);
    return newFolder;
  };

  const deleteFolder = (id: string) => {
    setFolders(prev => prev.filter(folder => folder.id !== id));
    setNotes(prev => prev.map(note => 
      note.folderId === id ? { ...note, folderId: null } : note
    ));
  };

  const getFilteredNotes = () => {
    let filtered = notes;

    if (selectedFolderId) {
      filtered = filtered.filter(note => note.folderId === selectedFolderId);
    }

    if (selectedDate) {
      const dateStr = selectedDate.toDateString();
      filtered = filtered.filter(note => 
        new Date(note.createdAt).toDateString() === dateStr
      );
    }

    return filtered;
  };

  return {
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