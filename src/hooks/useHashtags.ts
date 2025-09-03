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