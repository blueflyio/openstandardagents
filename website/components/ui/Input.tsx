'use client';

import React, { InputHTMLAttributes, forwardRef } from 'react';

// Simple className merger utility
function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

// ============================================================================
// INPUT COMPONENT
// ============================================================================
// Form input with label, error states, helper text, and accessibility
// ============================================================================

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      fullWidth = false,
      id,
      disabled,
      required,
      ...props
    },
    ref
  ) => {
    // Generate ID if not provided
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
    const errorId = `${inputId}-error`;
    const helperId = `${inputId}-helper`;

    // Base input styles
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
    ];

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

    // Icon padding adjustments
    const iconPaddingStyles = [];
    if (leftIcon) iconPaddingStyles.push('pl-10');
    if (rightIcon) iconPaddingStyles.push('pr-10');

    return (
      <div className={cn(fullWidth ? 'w-full' : 'w-auto')}>
        {/* Label */}
        {label && (
          <label
            htmlFor={inputId}
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

        {/* Input wrapper */}
        <div className="relative">
          {/* Left icon */}
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              {leftIcon}
            </div>
          )}

          {/* Input */}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              ...baseStyles,
              ...stateStyles,
              ...iconPaddingStyles,
              className
            )}
            disabled={disabled}
            required={required}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={cn(
              error ? errorId : undefined,
              helperText ? helperId : undefined
            )}
            {...props}
          />

          {/* Right icon */}
          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              {rightIcon}
            </div>
          )}
        </div>

        {/* Error message */}
        {error && (
          <p
            id={errorId}
            className="mt-1 text-sm text-error-600"
            role="alert"
          >
            {error}
          </p>
        )}

        {/* Helper text */}
        {helperText && !error && (
          <p
            id={helperId}
            className="mt-1 text-sm text-gray-500"
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input };
