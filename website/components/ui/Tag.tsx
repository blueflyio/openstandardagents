'use client';

import React, { HTMLAttributes, forwardRef } from 'react';

// Simple className merger utility
function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

// ============================================================================
// TAG COMPONENT
// ============================================================================
// Tag/chip component with removable option and color variants
// ============================================================================

export interface TagProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  removable?: boolean;
  onRemove?: () => void;
}

const Tag = forwardRef<HTMLSpanElement, TagProps>(
  (
    {
      className,
      variant = 'default',
      size = 'md',
      removable = false,
      onRemove,
      children,
      ...props
    },
    ref
  ) => {
    // Base styles
    const baseStyles = [
      'inline-flex',
      'items-center',
      'gap-1.5',
      'font-medium',
      'rounded-md',
      'transition-colors',
      'duration-200',
    ];

    // Variant styles
    const variantStyles = {
      default: [
        'bg-gray-200',
        'text-gray-800',
        'hover:bg-gray-300',
      ],
      success: [
        'bg-success-200',
        'text-success-900',
        'hover:bg-success-300',
      ],
      warning: [
        'bg-warning-200',
        'text-warning-900',
        'hover:bg-warning-300',
      ],
      error: [
        'bg-error-200',
        'text-error-900',
        'hover:bg-error-300',
      ],
      info: [
        'bg-info-200',
        'text-info-900',
        'hover:bg-info-300',
      ],
      primary: [
        'bg-primary-200',
        'text-primary-900',
        'hover:bg-primary-300',
      ],
      secondary: [
        'bg-secondary-200',
        'text-secondary-900',
        'hover:bg-secondary-300',
      ],
    };

    // Size styles
    const sizeStyles = {
      sm: ['text-xs', 'px-2', 'py-0.5'],
      md: ['text-sm', 'px-2.5', 'py-1'],
      lg: ['text-base', 'px-3', 'py-1.5'],
    };

    // Remove button colors
    const removeButtonColors = {
      default: 'hover:bg-gray-400',
      success: 'hover:bg-success-400',
      warning: 'hover:bg-warning-400',
      error: 'hover:bg-error-400',
      info: 'hover:bg-info-400',
      primary: 'hover:bg-primary-400',
      secondary: 'hover:bg-secondary-400',
    };

    return (
      <span
        ref={ref}
        className={cn(
          ...baseStyles,
          ...variantStyles[variant],
          ...sizeStyles[size],
          className
        )}
        {...props}
      >
        {children}
        
        {removable && onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className={cn(
              'flex-shrink-0',
              'rounded-full',
              'p-0.5',
              'transition-colors',
              'duration-200',
              'focus:outline-none',
              'focus:ring-2',
              'focus:ring-offset-1',
              'focus:ring-current',
              removeButtonColors[variant]
            )}
            aria-label="Remove tag"
          >
            <svg
              className="w-3 h-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </span>
    );
  }
);

Tag.displayName = 'Tag';

export { Tag };
