'use client';

import React, { InputHTMLAttributes, forwardRef } from 'react';

// Simple className merger utility
function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

// ============================================================================
// RADIO COMPONENT
// ============================================================================
// Radio button with label, error states, and accessibility
// ============================================================================

export interface RadioProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
  helperText?: string;
}

const Radio = forwardRef<HTMLInputElement, RadioProps>(
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
    const radioId = id || `radio-${Math.random().toString(36).substr(2, 9)}`;
    const errorId = `${radioId}-error`;
    const helperId = `${radioId}-helper`;

    // Base radio styles
    const baseStyles = [
      'w-5',
      'h-5',
      'rounded-full',
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
          {/* Radio */}
          <input
            ref={ref}
            type="radio"
            id={radioId}
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
                  htmlFor={radioId}
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

Radio.displayName = 'Radio';

export { Radio };
