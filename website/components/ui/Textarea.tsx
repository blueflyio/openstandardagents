'use client';

import React, { TextareaHTMLAttributes, forwardRef, useState } from 'react';

// Simple className merger utility
function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

// ============================================================================
// TEXTAREA COMPONENT
// ============================================================================
// Textarea with label, error states, character count, and accessibility
// ============================================================================

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
  showCharCount?: boolean;
  resize?: 'none' | 'vertical' | 'horizontal' | 'both';
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      label,
      error,
      helperText,
      fullWidth = false,
      showCharCount = false,
      resize = 'vertical',
      id,
      disabled,
      required,
      maxLength,
      value,
      defaultValue,
      onChange,
      ...props
    },
    ref
  ) => {
    // Track character count
    const [charCount, setCharCount] = useState(
      (value?.toString() || defaultValue?.toString() || '').length
    );

    // Generate ID if not provided
    const textareaId = id || `textarea-${Math.random().toString(36).substr(2, 9)}`;
    const errorId = `${textareaId}-error`;
    const helperId = `${textareaId}-helper`;

    // Handle change to update character count
    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setCharCount(e.target.value.length);
      onChange?.(e);
    };

    // Base textarea styles
    const baseStyles = [
      'block',
      'w-full',
      'rounded-lg',
      'border',
      'px-4',
      'py-2',
      'text-base',
      'transition-colors',
      'duration-200',
      'focus:outline-none',
      'focus:ring-2',
      'focus:ring-offset-1',
      'disabled:opacity-50',
      'disabled:cursor-not-allowed',
      'disabled:bg-gray-100',
      'min-h-[100px]',
    ];

    // Resize styles
    const resizeStyles = {
      none: 'resize-none',
      vertical: 'resize-y',
      horizontal: 'resize-x',
      both: 'resize',
    };

    // State-based styles
    const stateStyles = error
      ? [
          'border-error-500',
          'text-error-900',
          'focus:border-error-500',
          'focus:ring-error-500',
        ]
      : [
          'border-gray-300',
          'text-gray-900',
          'focus:border-primary-500',
          'focus:ring-primary-500',
        ];

    return (
      <div className={cn(fullWidth ? 'w-full' : 'w-auto')}>
        {/* Label */}
        {label && (
          <label
            htmlFor={textareaId}
            className={cn(
              'block',
              'text-sm',
              'font-medium',
              'mb-1',
              error ? 'text-error-700' : 'text-gray-700'
            )}
          >
            {label}
            {required && <span className="text-error-500 ml-1">*</span>}
          </label>
        )}

        {/* Textarea */}
        <textarea
          ref={ref}
          id={textareaId}
          className={cn(
            ...baseStyles,
            resizeStyles[resize],
            ...stateStyles,
            className
          )}
          disabled={disabled}
          required={required}
          maxLength={maxLength}
          value={value}
          defaultValue={defaultValue}
          onChange={handleChange}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={cn(
            error ? errorId : undefined,
            helperText ? helperId : undefined
          )}
          {...props}
        />

        {/* Character count and helper text row */}
        <div className="flex items-center justify-between mt-1">
          <div className="flex-1">
            {/* Error message */}
            {error && (
              <p
                id={errorId}
                className="text-sm text-error-600"
                role="alert"
              >
                {error}
              </p>
            )}

            {/* Helper text */}
            {helperText && !error && (
              <p
                id={helperId}
                className="text-sm text-gray-500"
              >
                {helperText}
              </p>
            )}
          </div>

          {/* Character count */}
          {showCharCount && maxLength && (
            <p
              className={cn(
                'text-sm',
                'ml-2',
                'flex-shrink-0',
                charCount > maxLength ? 'text-error-600' : 'text-gray-500'
              )}
              aria-live="polite"
            >
              {charCount} / {maxLength}
            </p>
          )}
        </div>
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

export { Textarea };
