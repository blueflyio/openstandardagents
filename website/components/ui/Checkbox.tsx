'use client';

import React, { InputHTMLAttributes, forwardRef } from 'react';

// Simple className merger utility
function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

// ============================================================================
// CHECKBOX COMPONENT
// ============================================================================
// Checkbox with label, error states, and accessibility
// ============================================================================

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
  helperText?: string;
}

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  (
    {
      className,
      label,
      error,
      helperText,
      id,
      disabled,
      ...props
    },
    ref
  ) => {
    // Generate ID if not provided
    const checkboxId = id || `checkbox-${Math.random().toString(36).substr(2, 9)}`;
    const errorId = `${checkboxId}-error`;
    const helperId = `${checkboxId}-helper`;

    // Base checkbox styles
    const baseStyles = [
      'w-5',
      'h-5',
      'rounded',
      'border-2',
      'transition-all',
      'duration-200',
      'cursor-pointer',
      'focus:outline-none',
      'focus:ring-2',
      'focus:ring-offset-2',
      'disabled:opacity-50',
      'disabled:cursor-not-allowed',
    ];

    // State-based styles
    const stateStyles = error
      ? [
          'border-error-500',
          'text-error-600',
          'focus:ring-error-500',
        ]
      : [
          'border-gray-300',
          'text-primary-600',
          'focus:ring-primary-500',
          'checked:bg-primary-600',
          'checked:border-primary-600',
        ];

    return (
      <div>
        <div className="flex items-start gap-3">
          {/* Checkbox */}
          <input
            ref={ref}
            type="checkbox"
            id={checkboxId}
            className={cn(
              ...baseStyles,
              ...stateStyles,
              className
            )}
            disabled={disabled}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={cn(
              error ? errorId : undefined,
              helperText ? helperId : undefined
            )}
            {...props}
          />

          {/* Label and helper text */}
          {(label || helperText) && (
            <div className="flex-1">
              {label && (
                <label
                  htmlFor={checkboxId}
                  className={cn(
                    'block',
                    'text-sm',
                    'font-medium',
                    'cursor-pointer',
                    error ? 'text-error-700' : 'text-gray-700',
                    disabled && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  {label}
                </label>
              )}

              {helperText && !error && (
                <p
                  id={helperId}
                  className="mt-0.5 text-sm text-gray-500"
                >
                  {helperText}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Error message */}
        {error && (
          <p
            id={errorId}
            className="mt-1 ml-8 text-sm text-error-600"
            role="alert"
          >
            {error}
          </p>
        )}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';

export { Checkbox };
