import { useState, useMemo, useCallback } from 'react';
import { Note } from '../types';
import { startOfDay } from 'date-fns';

/**
 * Hook especializado para filtrado y búsqueda de notas
 * Separado para mejor rendimiento y reutilización
 */
export function useNotesFilter(notes: Note[]) {
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Memoizar notas filtradas para evitar recálculos innecesarios
  const filteredNotes = useMemo(() => {
    console.log('🔍 Filtering notes:', {
      total: notes.length,
      selectedFolderId,
      selectedDate: selectedDate?.toISOString(),
      searchTerm
    });

    let filtered = notes;

    // Filtrar por carpeta
    if (selectedFolderId) {
      filtered = filtered.filter(note => note.folderId === selectedFolderId);
      console.log('📁 Filtered by folder:', filtered.length);
    }

    // Filtrar por fecha
    if (selectedDate) {
      const targetDate = startOfDay(selectedDate);
      filtered = filtered.filter(note => {
        const noteDate = startOfDay(new Date(note.createdAt));
        return noteDate.getTime() === targetDate.getTime();
      });
      console.log('📅 Filtered by date:', filtered.length);
    }

    // Filtrar por término de búsqueda
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(note => 
        note.title.toLowerCase().includes(term) ||
        note.content.toLowerCase().includes(term) ||
        note.tags.some(tag => tag.toLowerCase().includes(term))
      );
      console.log('🔍 Filtered by search term:', filtered.length);
    }

    console.log('✅ Final filtered notes:', filtered.length);
    return filtered;
  }, [notes, selectedFolderId, selectedDate, searchTerm]);

  // Memoizar estadísticas de filtros
  const filterStats = useMemo(() => {
    const totalNotes = notes.length;
    const filteredCount = filteredNotes.length;
    const hasActiveFilters = selectedFolderId || selectedDate || searchTerm.trim();

    return {
      totalNotes,
      filteredCount,
      hasActiveFilters,
      filterRatio: totalNotes > 0 ? filteredCount / totalNotes : 0,
    };
  }, [notes.length, filteredNotes.length, selectedFolderId, selectedDate, searchTerm]);

  // Funciones para manejar filtros
  const handleFolderSelect = useCallback((folderId: string | null) => {
    console.log('📁 Folder filter changed:', folderId);
    setSelectedFolderId(folderId);
  }, []);

  const handleDateSelect = useCallback((date: Date | null) => {
    console.log('📅 Date filter changed:', date?.toISOString());
    setSelectedDate(date);
  }, []);

  const handleSearchChange = useCallback((term: string) => {
    console.log('🔍 Search term changed:', term);
    setSearchTerm(term);
  }, []);

  const clearAllFilters = useCallback(() => {
    console.log('🧹 Clearing all filters');
    setSelectedFolderId(null);
    setSelectedDate(null);
    setSearchTerm('');
  }, []);

  const clearFolderFilter = useCallback(() => {
    setSelectedFolderId(null);
  }, []);

  const clearDateFilter = useCallback(() => {
    setSelectedDate(null);
  }, []);

  const clearSearchFilter = useCallback(() => {
    setSearchTerm('');
  }, []);

  return {
    // Estados de filtros
    selectedFolderId,
    selectedDate,
    searchTerm,
    
    // Datos filtrados
    filteredNotes,
    filterStats,
    
    // Funciones de control
    handleFolderSelect,
    handleDateSelect,
    handleSearchChange,
    clearAllFilters,
    clearFolderFilter,
    clearDateFilter,
    clearSearchFilter,
    
    // Setters directos (para compatibilidad)
    setSelectedFolderId,
    setSelectedDate,
    setSearchTerm,
  };
}