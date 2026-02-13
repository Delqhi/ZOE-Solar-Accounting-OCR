/**
 * designOS 2026 - Enhanced Input Components with Glassmorphism 2.0
 * Next-generation input components with advanced styling and micro-interactions
 */

import { forwardRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Types
export type InputVariant = 'filled' | 'outline' | 'ghost' | 'neon';
export type InputSize = 'sm' | 'md' | 'lg';
export type ValidationState = 'default' | 'valid' | 'invalid' | 'warning';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: InputVariant;
  size?: InputSize;
  label?: string;
  helperText?: string;
  validationState?: ValidationState;
  fullWidth?: boolean;
  className?: string;
  animation?: boolean;
  glowEffect?: boolean;
}

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  variant?: InputVariant;
  size?: InputSize;
  label?: string;
  helperText?: string;
  validationState?: ValidationState;
  fullWidth?: boolean;
  className?: string;
  animation?: boolean;
  glowEffect?: boolean;
}

// Animation variants
const inputVariants = {
  focus: {
    scale: 1.02,
    transition: { duration: 0.2, ease: "easeOut" }
  },
  hover: {
    scale: 1.01,
    transition: { duration: 0.15, ease: "easeOut" }
  },
  tap: {
    scale: 0.98,
    transition: { duration: 0.05 }
  }
};

const labelVariants = {
  focus: {
    y: -24,
    scale: 0.85,
    color: "rgba(0, 212, 255, 0.9)",
    transition: { duration: 0.2, ease: "easeOut" }
  },
  default: {
    y: 0,
    scale: 1,
    color: "var(--color-text-muted)",
    transition: { duration: 0.2, ease: "easeOut" }
  }
};

// Base input styles
const getInputClasses = (props: InputProps) => {
  const {
    variant = 'filled',
    size = 'md',
    validationState = 'default',
    fullWidth = false,
    className = '',
    animation = true
  } = props;

  const baseClasses = [
    'input-field',
    'relative',
    'transition-all',
    'duration-200',
    'ease-out',
    'focus:ring-2',
    'focus:ring-primary/20'
  ];

  // Size variants
  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-3 text-base',
    lg: 'px-5 py-4 text-lg'
  };

  // Variant styles
  const variantClasses = {
    filled: 'bg-gradient-to-br from-white/5 to-white/10 border border-border/50',
    outline: 'bg-transparent border-2 border-border/60',
    ghost: 'bg-transparent border border-transparent',
    neon: 'bg-gradient-to-br from-white/5 to-white/10 border-2 border-primary/30 shadow-neon-primary'
  };

  // Validation states
  const validationClasses = {
    default: '',
    valid: 'border-success/60 shadow-[0_0_15px_rgba(0,204,102,0.3)]',
    invalid: 'border-error/60 shadow-[0_0_15px_rgba(255,71,87,0.3)]',
    warning: 'border-warning/60 shadow-[0_0_15px_rgba(255,176,32,0.3)]'
  };

  // Full width
  const widthClass = fullWidth ? 'w-full' : '';

  return [
    ...baseClasses,
    sizeClasses[size],
    variantClasses[variant],
    validationClasses[validationState],
    widthClass,
    animation ? 'hover:scale-105' : '',
    className
  ].filter(Boolean).join(' ');
};

// Enhanced Input Component
export const Input2026 = forwardRef<HTMLInputElement, InputProps>(
  ({ label, helperText, validationState, className, animation = true, glowEffect = false, ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false);
    const [hasValue, setHasValue] = useState(!!props.value || !!props.defaultValue);

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      props.onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      props.onBlur?.(e);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setHasValue(!!e.target.value);
      props.onChange?.(e);
    };

    const inputClasses = getInputClasses({ ...props, validationState, className });

    return (
      <div className="relative group">
        {/* Floating Label */}
        {label && (
          <motion.label
            htmlFor={props.id}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 text-sm text-text-muted pointer-events-none transition-all duration-200"
            variants={labelVariants}
            animate={isFocused || hasValue ? 'focus' : 'default'}
          >
            {label}
          </motion.label>
        )}

        {/* Input Element */}
        <motion.input
          ref={ref}
          {...props}
          className={inputClasses}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onChange={handleChange}
          animate={animation ? (isFocused ? 'focus' : 'default') : {}}
          whileHover={animation ? 'hover' : {}}
          whileTap={animation ? 'tap' : {}}
          variants={inputVariants}
          style={{
            paddingLeft: label ? '1rem' : undefined,
            paddingTop: label ? '1.5rem' : undefined,
            paddingBottom: label ? '0.5rem' : undefined
          }}
        />

        {/* Helper Text */}
        {helperText && (
          <motion.p
            className="mt-2 text-xs text-text-muted"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {helperText}
          </motion.p>
        )}

        {/* Focus Glow Effect */}
        {glowEffect && (
          <div className="absolute inset-0 rounded-lg pointer-events-none">
            <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-primary/10 via-transparent to-accent/10 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300"></div>
          </div>
        )}

        {/* Micro-interaction: subtle particles on focus */}
        {animation && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-lg">
            <div className={`absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-primary/5 to-transparent transform -skew-x-12 opacity-0 group-focus-within:opacity-100 transition-opacity duration-500 ${isFocused ? 'animate-pulse' : ''}`}></div>
          </div>
        )}
      </div>
    );
  }
);

Input2026.displayName = 'Input2026';

// Enhanced TextArea Component
export const TextArea2026 = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ label, helperText, validationState, className, animation = true, glowEffect = false, ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false);
    const [hasValue, setHasValue] = useState(!!props.value || !!props.defaultValue);

    const handleFocus = (e: React.FocusEvent<HTMLTextAreaElement>) => {
      setIsFocused(true);
      props.onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
      setIsFocused(false);
      props.onBlur?.(e);
    };

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setHasValue(!!e.target.value);
      props.onChange?.(e);
    };

    const inputClasses = getInputClasses({ ...props, validationState, className } as InputProps);

    return (
      <div className="relative group">
        {/* Floating Label */}
        {label && (
          <motion.label
            htmlFor={props.id}
            className="absolute left-4 top-3 text-sm text-text-muted pointer-events-none transition-all duration-200"
            variants={labelVariants}
            animate={isFocused || hasValue ? 'focus' : 'default'}
          >
            {label}
          </motion.label>
        )}

        {/* TextArea Element */}
        <motion.textarea
          ref={ref}
          {...props}
          className={`${inputClasses} resize-none min-h-[120px]`}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onChange={handleChange}
          animate={animation ? (isFocused ? 'focus' : 'default') : {}}
          whileHover={animation ? 'hover' : {}}
          whileTap={animation ? 'tap' : {}}
          variants={inputVariants}
          style={{
            paddingLeft: label ? '1rem' : undefined,
            paddingTop: label ? '2.5rem' : undefined,
            paddingBottom: label ? '0.5rem' : undefined
          }}
        />

        {/* Helper Text */}
        {helperText && (
          <motion.p
            className="mt-2 text-xs text-text-muted"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {helperText}
          </motion.p>
        )}

        {/* Focus Glow Effect */}
        {glowEffect && (
          <div className="absolute inset-0 rounded-lg pointer-events-none">
            <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-primary/10 via-transparent to-accent/10 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300"></div>
          </div>
        )}
      </div>
    );
  }
);

TextArea2026.displayName = 'TextArea2026';

// Search Input with enhanced UX
export const SearchInput2026 = forwardRef<HTMLInputElement, InputProps>(
  ({ className, animation = true, ...props }, ref) => {
    return (
      <div className="relative group">
        <Input2026
          ref={ref}
          {...props}
          variant="ghost"
          className={`pl-12 ${className}`}
          animation={animation}
          glowEffect={true}
        />
        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/>
            <path d="M21 21l-4.35-4.35"/>
          </svg>
        </div>
      </div>
    );
  }
);

SearchInput2026.displayName = 'SearchInput2026';

// Password Input with show/hide toggle
export const PasswordInput2026 = forwardRef<HTMLInputElement, InputProps>(
  ({ className, animation = true, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);

    return (
      <div className="relative group">
        <Input2026
          ref={ref}
          type={showPassword ? 'text' : 'password'}
          {...props}
          className={`pr-12 ${className}`}
          animation={animation}
          glowEffect={true}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-muted hover:text-primary transition-colors"
        >
          {showPassword ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
              <line x1="1" y1="1" x2="23" y2="23"/>
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
          )}
        </button>
      </div>
    );
  }
);

PasswordInput2026.displayName = 'PasswordInput2026';

// Export all components
export {
  Input2026 as Input,
  TextArea2026 as TextArea,
  SearchInput2026 as SearchInput,
  PasswordInput2026 as PasswordInput
};