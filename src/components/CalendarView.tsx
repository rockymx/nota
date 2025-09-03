import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday } from 'date-fns';
import { es } from 'date-fns/locale';

interface CalendarViewProps {
  selectedDate: Date | null;
  onDateSelect: (date: Date | null) => void;
}

export function CalendarView({ selectedDate, onDateSelect }: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

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

          return (
            <button
              key={day.toISOString()}
              onClick={() => handleDateClick(day)}
              className={`
                aspect-square flex items-center justify-center text-sm rounded-lg transition-colors
                ${isSelected 
                  ? 'bg-blue-500 text-white' 
                  : isTodayDate
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium'
                  : 'hover:bg-app-secondary text-app-primary'
                }
              `}
            >
              {format(day, 'd')}
            </button>
          );
        })}
      </div>

      {/* Clear filter */}
      {selectedDate && (
        <button
          onClick={() => onDateSelect(null)}
          className="w-full mt-4 text-sm text-app-secondary hover:text-app-primary transition-colors"
        >
          Limpiar filtro de fecha
        </button>
      )}
    </div>
  );
}