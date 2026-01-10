/**
 * designOS Card Component
 * Surface components with elevation and padding
 */
import React from 'react';

export type CardVariant = 'elevated' | 'filled' | 'outline' | 'ghost';
export type CardPadding = 'none' | 'sm' | 'md' | 'lg' | 'xl';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  padding?: CardPadding;
  hoverable?: boolean;
  header?: React.ReactNode;
  footer?: React.ReactNode;
}

const variantStyles: Record<CardVariant, string> = {
  elevated: 'bg-surface shadow-md border border-border',
  filled: 'bg-surface border border-border',
  outline: 'bg-transparent border-2 border-border',
  ghost: 'bg-transparent border border-border/20',
};

const paddingStyles: Record<CardPadding, string> = {
  none: 'p-0',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
  xl: 'p-8',
};

export function Card({
  variant = 'elevated',
  padding = 'md',
  hoverable = false,
  header,
  footer,
  children,
  className = '',
  ...props
}: CardProps) {
  return (
    <div
      className={`
        rounded-lg
        transition-all duration-200
        ${variantStyles[variant]}
        ${paddingStyles[padding]}
        ${hoverable ? 'hover:shadow-lg hover:scale-[1.01] cursor-pointer' : ''}
        ${className}
      `}
      {...props}
    >
      {header && (
        <div className="border-b border-border/30 pb-3 mb-3">
          {header}
        </div>
      )}
      
      <div className="space-y-3">
        {children}
      </div>
      
      {footer && (
        <div className="border-t border-border/30 pt-3 mt-3">
          {footer}
        </div>
      )}
    </div>
  );
}

// Convenience variants
export const ElevatedCard = (props: Omit<CardProps, 'variant'>) => (
  <Card variant="elevated" {...props} />
);

export const FilledCard = (props: Omit<CardProps, 'variant'>) => (
  <Card variant="filled" {...props} />
);

export const OutlineCard = (props: Omit<CardProps, 'variant'>) => (
  <Card variant="outline" {...props} />
);

export const GhostCard = (props: Omit<CardProps, 'variant'>) => (
  <Card variant="ghost" {...props} />
);