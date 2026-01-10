/**
 * designOS Input Component
 * Form inputs with validation states and variants
 */
import React from 'react';

export type InputVariant = 'filled' | 'outline' | 'underline';
export type InputSize = 'sm' | 'md' | 'lg';
export type ValidationState = 'default' | 'success' | 'error' | 'warning';

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  variant?: InputVariant;
  inputSize?: InputSize;
  validation?: ValidationState;
  message?: string;
  label?: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

const variantStyles: Record<InputVariant, string> = {
  filled: 'bg-surface border border-border hover:border-primary-400 focus:border-primary-500',
  outline: 'bg-transparent border-2 border-border hover:border-primary-400 focus:border-primary-500',
  underline: 'bg-transparent border-b-2 border-border hover:border-primary-400 focus:border-primary-500 border-t-0 border-l-0 border-r-0',
};

const sizeStyles: Record<InputSize, string> = {
  sm: 'px-2 py-1 text-sm',
  md: 'px-3 py-2 text-base',
  lg: 'px-4 py-3 text-lg',
};

const validationStyles: Record<ValidationState, string> = {
  default: 'border-border focus:ring-primary-500',
  success: 'border-success focus:ring-success-500 text-success',
  error: 'border-error focus:ring-error-500 text-error',
  warning: 'border-warning focus:ring-warning-500 text-warning',
};

const messageStyles: Record<ValidationState, string> = {
  default: 'text-text-muted',
  success: 'text-success',
  error: 'text-error',
  warning: 'text-warning',
};

export function Input({
  variant = 'outline',
  inputSize = 'md',
  validation = 'default',
  message,
  label,
  icon,
  iconPosition = 'left',
  className = '',
  disabled,
  ...props
}: InputProps) {
  return (
    <div className="flex flex-col gap-1 w-full">
      {label && (
        <label className={`
          font-medium text-sm
          ${validation === 'default' ? 'text-text' : validationStyles[validation].replace('border-', 'text-')}
        `}>
          {label}
        </label>
      )}
      
      <div className="relative flex items-center">
        {icon && iconPosition === 'left' && (
          <span className={`
            absolute left-3 pointer-events-none
            ${validation === 'default' ? 'text-text-muted' : validationStyles[validation].replace(/border-\w+/, 'text-')}
            ${inputSize === 'sm' ? 'text-sm' : inputSize === 'lg' ? 'text-lg' : 'text-base'}
          `}>
            {icon}
          </span>
        )}
        
        <input
          className={`
            w-full rounded-md
            transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-offset-2
            disabled:opacity-50 disabled:cursor-not-allowed
            ${variantStyles[variant]}
            ${sizeStyles[inputSize]}
            ${validationStyles[validation]}
            ${icon ? (iconPosition === 'left' ? 'pl-10' : 'pr-10') : ''}
            ${className}
          `}
          disabled={disabled}
          {...props}
        />
        
        {icon && iconPosition === 'right' && (
          <span className={`
            absolute right-3 pointer-events-none
            ${validation === 'default' ? 'text-text-muted' : validationStyles[validation].replace(/border-\w+/, 'text-')}
            ${inputSize === 'sm' ? 'text-sm' : inputSize === 'lg' ? 'text-lg' : 'text-base'}
          `}>
            {icon}
          </span>
        )}
      </div>
      
      {message && (
        <span className={`text-xs ${messageStyles[validation]}`}>
          {message}
        </span>
      )}
    </div>
  );
}

// Convenience variants
export const FilledInput = (props: Omit<InputProps, 'variant'>) => (
  <Input variant="filled" {...props} />
);

export const OutlineInput = (props: Omit<InputProps, 'variant'>) => (
  <Input variant="outline" {...props} />
);

export const UnderlineInput = (props: Omit<InputProps, 'variant'>) => (
  <Input variant="underline" {...props} />
);