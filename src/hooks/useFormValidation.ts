import { useState, useCallback, useMemo } from 'react';
import { z } from 'zod';

/**
 * Hook para validación de formularios en tiempo real
 * Proporciona validación, errores y estado de campos
 */

interface FieldState {
  value: string;
  error: string | null;
  touched: boolean;
  valid: boolean;
}

interface FormValidationOptions {
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  showErrorsOnlyAfterTouch?: boolean;
}

export function useFormValidation<T extends Record<string, any>>(
  schema: z.ZodSchema<T>,
  initialValues: Partial<T> = {},
  options: FormValidationOptions = {}
) {
  const {
    validateOnChange = true,
    validateOnBlur = true,
    showErrorsOnlyAfterTouch = true,
  } = options;

  // Estado de los campos
  const [fields, setFields] = useState<Record<string, FieldState>>(() => {
    const initialFields: Record<string, FieldState> = {};
    
    Object.keys(initialValues).forEach(key => {
      initialFields[key] = {
        value: String(initialValues[key] || ''),
        error: null,
        touched: false,
        valid: true,
      };
    });
    
    return initialFields;
  });

  // Validar un campo específico
  const validateField = useCallback((fieldName: string, value: string) => {
    try {
      // Crear un objeto parcial para validar solo este campo
      const partialData = { [fieldName]: value };
      const fieldSchema = (schema as any).pick({ [fieldName]: true });
      fieldSchema.parse(partialData);
      
      return { valid: true, error: null };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldError = error.issues.find((err: any) => err.path.includes(fieldName));
        return { 
          valid: false, 
          error: fieldError?.message || 'Error de validación' 
        };
      }
      return { valid: false, error: 'Error de validación desconocido' };
    }
  }, [schema]);

  // Actualizar valor de campo
  const setFieldValue = useCallback((fieldName: string, value: string) => {
    setFields(prev => {
      const newFields = { ...prev };
      
      if (!newFields[fieldName]) {
        newFields[fieldName] = {
          value: '',
          error: null,
          touched: false,
          valid: true,
        };
      }
      
      newFields[fieldName] = {
        ...newFields[fieldName],
        value,
      };

      // Validar en tiempo real si está habilitado
      if (validateOnChange && newFields[fieldName].touched) {
        const validation = validateField(fieldName, value);
        newFields[fieldName].valid = validation.valid;
        newFields[fieldName].error = validation.error;
      }
      
      return newFields;
    });
  }, [validateField, validateOnChange]);

  // Marcar campo como tocado
  const setFieldTouched = useCallback((fieldName: string, touched: boolean = true) => {
    setFields(prev => {
      const newFields = { ...prev };
      
      if (!newFields[fieldName]) {
        newFields[fieldName] = {
          value: '',
          error: null,
          touched: false,
          valid: true,
        };
      }
      
      newFields[fieldName] = {
        ...newFields[fieldName],
        touched,
      };

      // Validar cuando se marca como tocado
      if (touched && validateOnBlur) {
        const validation = validateField(fieldName, newFields[fieldName].value);
        newFields[fieldName].valid = validation.valid;
        newFields[fieldName].error = validation.error;
      }
      
      return newFields;
    });
  }, [validateField, validateOnBlur]);

  // Validar todo el formulario
  const validateForm = useCallback((): { valid: boolean; errors: Record<string, string>; data?: T } => {
    const formData: Record<string, any> = {};
    const errors: Record<string, string> = {};
    
    // Recopilar valores actuales
    Object.keys(fields).forEach(fieldName => {
      formData[fieldName] = fields[fieldName].value;
    });
    
    try {
      const validatedData = schema.parse(formData);
      return { valid: true, errors: {}, data: validatedData };
    } catch (error) {
      if (error instanceof z.ZodError) {
        error.issues.forEach((err: any) => {
          const fieldName = err.path[0] as string;
          if (fieldName) {
            errors[fieldName] = err.message;
          }
        });
      }
      return { valid: false, errors };
    }
  }, [fields, schema]);

  // Resetear formulario
  const resetForm = useCallback((newValues: Partial<T> = {}) => {
    const resetFields: Record<string, FieldState> = {};
    
    Object.keys(newValues).forEach(key => {
      resetFields[key] = {
        value: String(newValues[key] || ''),
        error: null,
        touched: false,
        valid: true,
      };
    });
    
    setFields(resetFields);
  }, []);

  // Obtener props para un input específico
  const getFieldProps = useCallback((fieldName: string) => {
    const field = fields[fieldName] || {
      value: '',
      error: null,
      touched: false,
      valid: true,
    };

    return {
      value: field.value,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFieldValue(fieldName, e.target.value);
      },
      onBlur: () => {
        setFieldTouched(fieldName, true);
      },
      error: showErrorsOnlyAfterTouch ? (field.touched ? field.error : null) : field.error,
      isValid: field.valid,
      isTouched: field.touched,
    };
  }, [fields, setFieldValue, setFieldTouched, showErrorsOnlyAfterTouch]);

  // Estado computado del formulario
  const formState = useMemo(() => {
    const fieldValues = Object.values(fields);
    const hasErrors = fieldValues.some(field => field.error !== null);
    const allTouched = fieldValues.every(field => field.touched);
    const allValid = fieldValues.every(field => field.valid);
    const hasValues = fieldValues.some(field => field.value.trim() !== '');
    
    return {
      isValid: allValid && !hasErrors,
      hasErrors,
      allTouched,
      hasValues,
      isDirty: fieldValues.some(field => field.touched),
    };
  }, [fields]);

  return {
    fields,
    formState,
    setFieldValue,
    setFieldTouched,
    validateForm,
    resetForm,
    getFieldProps,
    validateField,
  };
}