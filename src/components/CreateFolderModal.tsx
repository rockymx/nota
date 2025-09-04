import React, { useState } from 'react';
import { X, Folder } from 'lucide-react';
import { useFormValidation } from '../hooks/useFormValidation';
import { entitySchemas } from '../lib/validation';
import { ValidatedInput } from './forms/ValidatedInput';

interface CreateFolderModalProps {
  onClose: () => void;
  onCreateFolder: (name: string, color: string) => void;
}

const FOLDER_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Yellow
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#06B6D4', // Cyan
  '#F97316', // Orange
  '#84CC16', // Lime
];

export function CreateFolderModal({ onClose, onCreateFolder }: CreateFolderModalProps) {
  const {
    fields,
    formState,
    getFieldProps,
    validateForm,
    setFieldValue,
  } = useFormValidation(entitySchemas.folder, {
    name: '',
    color: FOLDER_COLORS[0],
  });

  const [selectedColor, setSelectedColor] = useState(FOLDER_COLORS[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = validateForm();
    if (!validation.valid) {
      console.log('❌ Form validation failed:', validation.errors);
      return;
    }

    console.log('✅ Form validation passed:', validation.data);
    setIsSubmitting(true);
    
    try {
      onCreateFolder(validation.data!.name, selectedColor);
      onClose();
    } catch (error) {
      console.error('Error creating folder:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Actualizar color en el estado de validación
  React.useEffect(() => {
    setFieldValue('color', selectedColor);
  }, [selectedColor, setFieldValue]);
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-app rounded-xl shadow-app-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-app">
          <h2 className="text-lg font-semibold text-app-primary">Nueva Carpeta</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-app-secondary transition-colors"
          >
            <X className="w-5 h-5 text-app-secondary" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <ValidatedInput
              {...getFieldProps('name')}
              label="Nombre de la carpeta"
              placeholder="Ej: Trabajo, Personal, Ideas..."
              required
              autoFocus
              showValidIcon
              helperText="Entre 1 y 50 caracteres, solo letras, números y símbolos básicos"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-app-primary mb-3">
              Color de la carpeta
            </label>
            <div className="grid grid-cols-4 gap-3">
              {FOLDER_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  className={`w-12 h-12 rounded-lg flex items-center justify-center transition-all ${
                    selectedColor === color
                      ? 'ring-2 ring-offset-2 ring-blue-400 scale-110'
                      : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: color }}
                >
                  <Folder className="w-6 h-6 text-white" />
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 btn-secondary"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!formState.isValid || isSubmitting}
              className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creando...
                </>
              ) : (
                'Crear Carpeta'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}