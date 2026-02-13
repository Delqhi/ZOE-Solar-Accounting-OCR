/**
 * Enhanced Input Component - 2026 UX Standards
 * Features: Floating labels, validation states, micro-interactions, accessibility
 */
import React, { useState, useRef, useEffect } from 'react';
import clsx from 'clsx';

interface EnhancedInputProps {
  id: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'search';
  label?: string;
  placeholder?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  onBlur?: (value: string) => void;
  onFocus?: () => void;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  success?: string;
  helperText?: string;
  icon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  className?: string;
  autoComplete?: string;
  autoFocus?: boolean;
  maxLength?: number;
  showCharacterCount?: boolean;
  floatingLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'standard' | 'filled' | 'outlined';
}

export const EnhancedInput: React.FC<EnhancedInputProps> = ({
  id,
  type = 'text',
  label,
  placeholder,
  value,
  defaultValue,
  onChange,
  onBlur,
  onFocus,
  disabled = false,
  required = false,
  error,
  success,
  helperText,
  icon,
  rightIcon,
  className,
  autoComplete,
  autoFocus = false,
  maxLength,
  showCharacterCount = false,
  floatingLabel = true,
  size = 'md',
  variant = 'outlined',
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [hasValue, setHasValue] = useState(!!(value || defaultValue));
  const inputRef = useRef<HTMLInputElement>(null);

  const isInvalid = !!error;
  const isValid = !!success && !isInvalid;
  const hasHelperText = helperText || showCharacterCount || isInvalid || isValid;

  const getBaseClasses = () => {
    const base = [
      'relative',
      'w-full',
      'transition-all',
      'duration-300',
      'ease-in-out',
      'focus-within:ring-2',
      'focus-within:ring-primary/30',
      'focus-within:border-primary/50',
    ];

    // Size variants
    const sizeClasses = {
      sm: 'h-10 px-3 text-sm',
      md: 'h-12 px-4 text-base',
      lg: 'h-14 px-5 text-lg',
    };

    // Variant styles
    const variantClasses = {
      standard: [
        'bg-transparent',
        'border-b-2',
        'border-border',
        'rounded-none',
      ],
      filled: [
        'bg-surface/60',
        'border',
        'border-transparent',
        'rounded-lg',
        'hover:bg-surface/80',
      ],
      outlined: [
        'bg-surface/40',
        'border',
        'border-border',
        'rounded-xl',
        'hover:border-border-hover',
        'backdrop-blur-sm',
      ],
    };

    // State modifiers
    const stateClasses = [
      isFocused && !disabled && 'ring-2 ring-primary/30 border-primary/50',
      isInvalid && 'border-error/50 ring-error/20',
      isValid && 'border-success/50 ring-success/20',
      disabled && 'opacity-50 cursor-not-allowed bg-surface/30',
    ].filter(Boolean);

    return clsx(
      base,
      sizeClasses[size],
      variantClasses[variant],
      stateClasses,
      className
    );
  };

  const getLabelClasses = () => {
    const base = [
      'absolute',
      'pointer-events-none',
      'transition-all',
      'duration-300',
      'ease-in-out',
      'text-text-muted',
      'font-medium',
    ];

    const sizeClasses = {
      sm: floatingLabel ? 'text-xs' : 'text-sm',
      md: floatingLabel ? 'text-sm' : 'text-base',
      lg: floatingLabel ? 'text-base' : 'text-lg',
    };

    const positionClasses = floatingLabel ? [
      isFocused || hasValue
        ? 'top-1 left-3 text-xs transform -translate-y-1 scale-90'
        : 'top-1/2 left-3 transform -translate-y-1/2',
      'bg-background',
      'px-1',
    ] : [
      'top-2 left-3',
    ];

    const stateClasses = [
      isFocused && 'text-primary',
      isInvalid && 'text-error',
      isValid && 'text-success',
    ].filter(Boolean);

    return clsx(
      base,
      sizeClasses[size],
      positionClasses,
      stateClasses
    );
  };

  const getIconClasses = () => {
    const base = [
      'absolute',
      'top-1/2',
      'transform',
      '-translate-y-1/2',
      'text-text-muted',
      'transition-all',
      'duration-300',
      'pointer-events-none',
      'z-10',
    ];

    const sizeClasses = {
      sm: 'left-3 w-4 h-4',
      md: 'left-4 w-5 h-5',
      lg: 'left-5 w-6 h-6',
    };

    const stateClasses = [
      isFocused && 'text-primary',
      isInvalid && 'text-error',
      isValid && 'text-success',
    ].filter(Boolean);

    return clsx(
      base,
      sizeClasses[size],
      stateClasses
    );
  };

  const getRightIconClasses = () => {
    const base = [
      'absolute',
      'top-1/2',
      'right-3',
      'transform',
      '-translate-y-1/2',
      'text-text-muted',
      'transition-all',
      'duration-300',
      'cursor-pointer',
      'hover:text-text',
    ];

    const sizeClasses = {
      sm: 'w-4 h-4',
      md: 'w-5 h-5',
      lg: 'w-6 h-6',
    };

    return clsx(
      base,
      sizeClasses[size]
    );
  };

  const getHelperTextClasses = () => {
    const base = [
      'text-xs',
      'mt-1',
      'transition-all',
      'duration-300',
    ];

    const stateClasses = [
      isInvalid && 'text-error animate-in slide-in-from-left',
      isValid && 'text-success animate-in slide-in-from-left',
      !isInvalid && !isValid && 'text-text-muted',
    ].filter(Boolean);

    return clsx(
      base,
      stateClasses
    );
  };

  const getCharacterCountClasses = () => {
    const base = [
      'text-xs',
      'ml-auto',
      'text-text-muted',
      'transition-all',
      'duration-300',
    ];

    const stateClasses = [
      isInvalid && 'text-error',
      isValid && 'text-success',
    ].filter(Boolean);

    return clsx(
      base,
      stateClasses
    );
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setHasValue(newValue.length > 0);
    onChange?.(newValue);
  };

  const handleFocus = () => {
    setIsFocused(true);
    onFocus?.();
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(false);
    setHasValue(e.target.value.length > 0);
    onBlur?.(e.target.value);
  };

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  return (
    <div className="relative">
      <div className={getBaseClasses()}>
        {/* Left Icon */}
        {icon && (
          <div className={getIconClasses()}>
            {icon}
          </div>
        )}

        {/* Input Field */}
        <input
          ref={inputRef}
          id={id}
          type={type}
          value={value}
          defaultValue={defaultValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          disabled={disabled}
          required={required}
          placeholder={floatingLabel ? '' : placeholder}
          autoComplete={autoComplete}
          maxLength={maxLength}
          className={clsx(
            'w-full',
            'bg-transparent',
            'border-none',
            'outline-none',
            'placeholder-transparent',
            'text-text',
            'caret-primary',
            icon && floatingLabel ? 'pl-10' : icon && !floatingLabel ? 'pl-10' : floatingLabel ? 'px-3' : 'px-4',
            rightIcon && 'pr-10'
          )}
          aria-invalid={isInvalid}
          aria-describedby={`${id}-helper ${id}-error`}
        />

        {/* Floating Label */}
        {label && floatingLabel && (
          <label
            htmlFor={id}
            className={getLabelClasses()}
            style={{
              left: icon ? '40px' : undefined,
              paddingLeft: icon ? '8px' : undefined,
            }}
          >
            {label}
            {required && <span className="text-error ml-1">*</span>}
          </label>
        )}

        {/* Static Label */}
        {label && !floatingLabel && (
          <label
            htmlFor={id}
            className="absolute -top-2 left-3 bg-background px-2 text-xs text-text-muted font-medium z-10 pointer-events-none"
          >
            {label}
            {required && <span className="text-error ml-1">*</span>}
          </label>
        )}

        {/* Right Icon */}
        {rightIcon && (
          <div className={getRightIconClasses()}>
            {rightIcon}
          </div>
        )}

        {/* Validation Icons */}
        {isInvalid && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-error">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
              <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
        )}

        {isValid && !isInvalid && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-success">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
              <path d="M8 12l3 3 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        )}
      </div>

      {/* Helper Text & Character Count */}
      {hasHelperText && (
        <div className="flex items-center justify-between mt-2">
          <span
            id={`${id}-helper`}
            className={getHelperTextClasses()}
          >
            {error || success || helperText || ''}
          </span>
          {showCharacterCount && maxLength && (
            <span className={getCharacterCountClasses()}>
              {value?.length || 0}/{maxLength}
            </span>
          )}
        </div>
      )}

      {/* Progress Bar for Input */}
      {maxLength && value && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-border rounded-full overflow-hidden">
          <div
            className={clsx(
              'h-full transition-all duration-300 ease-in-out',
              isInvalid ? 'bg-error' : isValid ? 'bg-success' : 'bg-primary'
            )}
            style={{
              width: `${((value.length / maxLength) * 100)}%`,
            }}
          />
        </div>
      )}
    </div>
  );
};