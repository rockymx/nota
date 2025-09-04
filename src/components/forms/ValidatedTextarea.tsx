import React, { forwardRef } from 'react';
import { AlertCircle, CheckCircle } from 'lucide-react';

interface ValidatedTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string | null;
  isValid?: boolean;
  isTouched?: boolean;
  showValidIcon?: boolean;
  helperText?: string;
  showCharCount?: boolean;
  maxLength?: number;
}

export const ValidatedTextarea = forwardRef<HTMLTextAreaElement, ValidatedTextareaProps>(
  ({ 
    label, 
    error, 
    isValid = true, 
    isTouched = false, 
    showValidIcon = false,
    helperText,
    showCharCount = false,
    maxLength,
    className = '',
    value = '',
    ...props 
  }, ref) => {
    const hasError = error && isTouched;
    const showSuccess = isValid && isTouched && showValidIcon && !hasError;
    const charCount = String(value).length;
    const isNearLimit = maxLength && charCount > maxLength * 0.8;

    return (
      <div className="space-y-1">
        {label && (
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-app-primary">
              {label}
              {props.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            {showCharCount && maxLength && (
              <span className={`text-xs ${
                isNearLimit 
                  ? charCount >= maxLength 
                    ? 'text-red-500' 
                    : 'text-yellow-500'
                  : 'text-app-tertiary'
              }`}>
                {charCount}/{maxLength}
              </span>
            )}
          </div>
        )}
        
        <div className="relative">
          <textarea
            ref={ref}
            value={value}
            maxLength={maxLength}
            className={`
              w-full px-3 py-2 border rounded-lg outline-none transition-all duration-200 resize-none
              ${showSuccess || hasError ? 'pr-10' : ''}
              ${hasError 
                ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200 bg-red-50 dark:bg-red-900/10' 
                : showSuccess
                ? 'border-green-300 focus:border-green-500 focus:ring-2 focus:ring-green-200 bg-green-50 dark:bg-green-900/10'
                : 'border-app focus:border-blue-500 focus:ring-2 focus:ring-blue-200 bg-app'
              }
              text-app-primary placeholder-app-tertiary
              ${className}
            `}
            {...props}
          />
          
          {(showSuccess || hasError) && (
            <div className="absolute right-3 top-3">
              {hasError ? (
                <AlertCircle className="w-5 h-5 text-red-500" />
              ) : showSuccess ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : null}
            </div>
          )}
        </div>
        
        {hasError && (
          <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </p>
        )}
        
        {helperText && !hasError && (
          <p className="text-xs text-app-tertiary">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

ValidatedTextarea.displayName = 'ValidatedTextarea';