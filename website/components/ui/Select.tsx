'use client';

import React, { SelectHTMLAttributes, forwardRef } from 'react';

// Simple className merger utility
function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

// ============================================================================
// SELECT COMPONENT
// ============================================================================
// Form select with label, error states, and accessibility
// ============================================================================

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
  options?: Array<{ value: string; label: string; disabled?: boolean }>;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      className,
      label,
      error,
      helperText,
      fullWidth = false,
      options,
      id,
      disabled,
      required,
      children,
      ...props
    },
    ref
  ) => {
    // Generate ID if not provided
    const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`;
    const errorId = `${selectId}-error`;
    const helperId = `${selectId}-helper`;

    // Base select styles
    const baseStyles = [
      'block',
      'w-full',
      'rounded-lg',
      'border',
      'px-4',
      'py-2',
      'pr-10',
      'text-base',
      'transition-colors',
      'duration-200',
      'focus:outline-none',
      'focus:ring-2',
      'focus:ring-offset-1',
      'disabled:opacity-50',
      'disabled:cursor-not-allowed',
      'disabled:bg-gray-100',
      'appearance-none',
      'bg-white',
      'cursor-pointer',
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

    return (
      <div className={cn(fullWidth ? 'w-full' : 'w-auto')}>
        {/* Label */}
        {label && (
          <label
            htmlFor={selectId}
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

        {/* Select wrapper */}
        <div className="relative">
          {/* Select */}
          <select
            ref={ref}
            id={selectId}
            className={cn(
              ...baseStyles,
              ...stateStyles,
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
          >
            {options
              ? options.map((option) => (
                  <option
                    key={option.value}
                    value={option.value}
                    disabled={option.disabled}
                  >
                    {option.label}
                  </option>
                ))
              : children}
          </select>

          {/* Dropdown icon */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
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

Select.displayName = 'Select';

export { Select };
