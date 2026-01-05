import React from 'react';

type CardVariant = 'default' | 'featured' | 'interactive' | 'ghost';
type CardPadding = 'sm' | 'md' | 'lg';
type CardElevation = 0 | 1 | 2 | 3;

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Card content */
  children: React.ReactNode;
  /** Visual variant */
  variant?: CardVariant;
  /** Padding size */
  padding?: CardPadding;
  /** Shadow elevation level */
  elevation?: CardElevation;
  /** Enable hover effects */
  hover?: boolean;
  /** Make card clickable */
  onClick?: () => void;
}

const variantClasses: Record<CardVariant, string> = {
  default: 'bg-white border border-gray-200 rounded-xl',
  featured:
    'bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-primary/20 rounded-xl',
  interactive:
    'bg-white border-2 border-gray-200 rounded-xl cursor-pointer hover:border-primary',
  ghost: 'bg-transparent border-none',
};

const paddingClasses: Record<CardPadding, string> = {
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

const elevationClasses: Record<CardElevation, string> = {
  0: 'shadow-none',
  1: 'shadow-sm',
  2: 'shadow-md',
  3: 'shadow-lg',
};

const hoverClasses = 'hover:shadow-xl hover:-translate-y-1 transition-all duration-300';

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    {
      className = '',
      variant = 'default',
      padding = 'md',
      elevation = 1,
      hover = false,
      children,
      onClick,
      ...props
    },
    ref
  ) => {
    const classes = [
      variantClasses[variant],
      paddingClasses[padding],
      elevationClasses[elevation],
      hover || onClick ? hoverClasses : '',
      onClick ? 'cursor-pointer' : '',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div
        ref={ref}
        className={classes}
        onClick={onClick}
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : undefined}
        onKeyDown={
          onClick
            ? (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onClick();
                }
              }
            : undefined
        }
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

// Card sub-components for better composition
export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className = '',
  children,
  ...props
}) => {
  return (
    <div className={`mb-4 ${className}`} {...props}>
      {children}
    </div>
  );
};

CardHeader.displayName = 'CardHeader';

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  className = '',
  children,
  ...props
}) => {
  return (
    <h3 className={`text-2xl font-semibold text-gray-900 ${className}`} {...props}>
      {children}
    </h3>
  );
};

CardTitle.displayName = 'CardTitle';

export const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({
  className = '',
  children,
  ...props
}) => {
  return (
    <p className={`text-gray-600 ${className}`} {...props}>
      {children}
    </p>
  );
};

CardDescription.displayName = 'CardDescription';

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className = '',
  children,
  ...props
}) => {
  return (
    <div className={className} {...props}>
      {children}
    </div>
  );
};

CardContent.displayName = 'CardContent';

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className = '',
  children,
  ...props
}) => {
  return (
    <div className={`mt-4 pt-4 border-t border-gray-200 ${className}`} {...props}>
      {children}
    </div>
  );
};

CardFooter.displayName = 'CardFooter';
