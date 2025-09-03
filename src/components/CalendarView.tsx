import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { Note } from '../types';

interface CalendarViewProps {
  selectedDate: Date | null;
  onDateSelect: (date: Date | null) => void;
  notes: Note[];
}

export function CalendarView({ selectedDate, onDateSelect, notes }: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Función mejorada para verificar si hay notas en un día específico
  const hasNotesOnDay = (date: Date) => {
    const targetDay = startOfDay(date);
    
    return notes.some(note => {
      const noteDate = startOfDay(new Date(note.createdAt));
      return isSameDay(noteDate, targetDay);
    });
  };

  // Función para contar notas en un día específico
  const getNotesCountForDay = (date: Date) => {
    const targetDay = startOfDay(date);
    
    return notes.filter(note => {
      const noteDate = startOfDay(new Date(note.createdAt));
      return isSameDay(noteDate, targetDay);
    }).length;
  };

  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const handleDateClick = (date: Date) => {
    if (selectedDate && isSameDay(date, selectedDate)) {
      onDateSelect(null);
    } else {
      onDateSelect(date);
    }
  };

  return (
    <div className="bg-app rounded-lg border border-app p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={previousMonth}
          className="p-2 rounded-lg hover:bg-app-secondary transition-colors"
        >
          <ChevronLeft className="w-4 h-4 text-app-secondary" />
        </button>
        <h3 className="text-sm font-semibold text-app-primary">
          {format(currentMonth, 'MMMM yyyy', { locale: es })}
        </h3>
        <button
          onClick={nextMonth}
          className="p-2 rounded-lg hover:bg-app-secondary transition-colors"
        >
          <ChevronRight className="w-4 h-4 text-app-secondary" />
        </button>
      </div>

      {/* Days of week */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((day) => (
          <div key={day} className="text-center text-xs font-medium text-app-tertiary py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const isSelected = selectedDate && isSameDay(day, selectedDate);
          const isTodayDate = isToday(day);
          const hasNotes = hasNotesOnDay(day);
          const notesCount = getNotesCountForDay(day);

          return (
            <button
              key={day.toISOString()}
              onClick={() => handleDateClick(day)}
              className={`
                aspect-square flex flex-col items-center justify-center text-sm rounded-lg transition-all duration-200 relative group
                ${isSelected 
                  ? 'bg-blue-500 text-white shadow-md scale-105' 
                  : isTodayDate
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-semibold ring-2 ring-blue-200 dark:ring-blue-700'
                  : hasNotes
                  ? 'hover:bg-blue-50 dark:hover:bg-blue-900/20 text-app-primary hover:scale-105'
                  : 'hover:bg-app-secondary text-app-primary hover:scale-105'
                }
              `}
              title={hasNotes ? `${notesCount} nota${notesCount > 1 ? 's' : ''} en este día` : undefined}
            >
              <span className="leading-none">
                {format(day, 'd')}
              </span>
              
              {/* Indicador de notas - Punto discreto */}
              {hasNotes && (
                <div className={`w-1.5 h-1.5 rounded-full mt-1 transition-colors ${
                  isSelected 
                    ? 'bg-white shadow-sm' 
                    : isTodayDate
                    ? 'bg-blue-600 dark:bg-blue-400'
                    : 'bg-blue-500 group-hover:bg-blue-600'
                }`} />
              )}
              
              {/* Indicador adicional para múltiples notas */}
              {notesCount > 1 && (
                <div className={`absolute top-1 right-1 w-2 h-2 rounded-full text-xs flex items-center justify-center ${
                  isSelected 
                    ? 'bg-white/20 text-white' 
                    : 'bg-blue-500 text-white'
                }`}>
                  <span className="text-[8px] font-bold leading-none">
                    {notesCount > 9 ? '9+' : notesCount}
                  </span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Clear filter */}
      {selectedDate && (
        <button
          onClick={() => onDateSelect(null)}
          className="w-full mt-4 text-sm text-app-secondary hover:text-app-primary transition-colors py-2 rounded-lg hover:bg-app-secondary"
        >
          Limpiar filtro de fecha
        </button>
      )}
    </div>
  );
}