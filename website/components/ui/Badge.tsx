import React from 'react';

type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info' | 'primary' | 'secondary';
type BadgeSize = 'sm' | 'md' | 'lg';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Badge content */
  children: React.ReactNode;
  /** Visual variant */
  variant?: BadgeVariant;
  /** Size variant */
  size?: BadgeSize;
  /** Icon to display before text */
  icon?: React.ReactNode;
  /** Dot indicator instead of full background */
  dot?: boolean;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-gray-100 text-gray-800 border border-gray-300',
  success: 'bg-success-100 text-success-800 border border-success-300',
  warning: 'bg-warning-100 text-warning-800 border border-warning-300',
  error: 'bg-error-100 text-error-800 border border-error-300',
  info: 'bg-info-100 text-info-800 border border-info-300',
  primary: 'bg-primary-100 text-primary-800 border border-primary-300',
  secondary: 'bg-secondary-100 text-secondary-800 border border-secondary-300',
};

const sizeClasses: Record<BadgeSize, string> = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-3 py-1 text-sm',
  lg: 'px-4 py-1.5 text-base',
};

const dotVariantClasses: Record<BadgeVariant, string> = {
  default: 'bg-gray-500',
  success: 'bg-success-500',
  warning: 'bg-warning-500',
  error: 'bg-error-500',
  info: 'bg-info-500',
  primary: 'bg-primary-500',
  secondary: 'bg-secondary-500',
};

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  (
    {
      className = '',
      variant = 'default',
      size = 'md',
      children,
      icon,
      dot = false,
      ...props
    },
    ref
  ) => {
    const classes = [
      'inline-flex items-center justify-center rounded-full font-semibold',
      variantClasses[variant],
      sizeClasses[size],
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <span ref={ref} className={classes} {...props}>
        {dot && (
          <span
            className={`w-2 h-2 rounded-full mr-1.5 ${dotVariantClasses[variant]}`}
            aria-hidden="true"
          />
        )}
        {icon && <span className="mr-1">{icon}</span>}
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';
