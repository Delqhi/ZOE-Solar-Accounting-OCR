/**
 * designOS Button Component
 * Dark-first button with variants and sizes
 */
import React from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'accent' | 'ghost' | 'outline';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-white hover:bg-primary-600 focus:ring-primary-400',
  secondary: 'bg-secondary text-white hover:bg-secondary-600 focus:ring-secondary-400',
  accent: 'bg-accent text-background hover:bg-accent-600 focus:ring-accent-400',
  ghost: 'bg-transparent text-text hover:bg-surface-hover focus:ring-primary-400',
  outline: 'border-2 border-primary text-primary hover:bg-primary-100 focus:ring-primary-400',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
};

export function Button({
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  loading = false,
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`
        inline-flex items-center justify-center gap-2
        font-medium rounded-md
        transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${className}
      `}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
      )}
      
      {icon && iconPosition === 'left' && !loading && (
        <span className="inline-flex">{icon}</span>
      )}
      
      {children}
      
      {icon && iconPosition === 'right' && !loading && (
        <span className="inline-flex">{icon}</span>
      )}
    </button>
  );
}

// Convenience variants
export const PrimaryButton = (props: Omit<ButtonProps, 'variant'>) => (
  <Button variant="primary" {...props} />
);

export const SecondaryButton = (props: Omit<ButtonProps, 'variant'>) => (
  <Button variant="secondary" {...props} />
);

export const AccentButton = (props: Omit<ButtonProps, 'variant'>) => (
  <Button variant="accent" {...props} />
);

export const GhostButton = (props: Omit<ButtonProps, 'variant'>) => (
  <Button variant="ghost" {...props} />
);

export const OutlineButton = (props: Omit<ButtonProps, 'variant'>) => (
  <Button variant="outline" {...props} />
);