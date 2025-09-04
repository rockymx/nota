import React, { forwardRef } from 'react';
import { AlertCircle, CheckCircle } from 'lucide-react';

interface ValidatedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string | null;
  isValid?: boolean;
  isTouched?: boolean;
  showValidIcon?: boolean;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const ValidatedInput = forwardRef<HTMLInputElement, ValidatedInputProps>(
  ({ 
    label, 
    error, 
    isValid = true, 
    isTouched = false, 
    showValidIcon = false,
    helperText,
    leftIcon,
    rightIcon,
    className = '',
    ...props 
  }, ref) => {
    const hasError = error && isTouched;
    const showSuccess = isValid && isTouched && showValidIcon && !hasError;

    return (
      <div className="space-y-1">
        {label && (
          <label className="block text-sm font-medium text-app-primary">
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-app-tertiary">
              {leftIcon}
            </div>
          )}
          
          <input
            ref={ref}
            className={`
              w-full px-3 py-2 border rounded-lg outline-none transition-all duration-200
              ${leftIcon ? 'pl-10' : ''}
              ${rightIcon || showSuccess || hasError ? 'pr-10' : ''}
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
          
          {(rightIcon || showSuccess || hasError) && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              {hasError ? (
                <AlertCircle className="w-5 h-5 text-red-500" />
              ) : showSuccess ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                rightIcon
              )}
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

ValidatedInput.displayName = 'ValidatedInput';