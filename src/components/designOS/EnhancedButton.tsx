/**
 * Enhanced Button Component - 2026 UX Standards
 * Features: Multiple variants, loading states, micro-interactions, accessibility
 */
import React, { useState, useRef, useEffect } from 'react';
import clsx from 'clsx';

interface EnhancedButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger' | 'success' | 'warning';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  disabled?: boolean;
  loading?: boolean;
  type?: 'button' | 'submit' | 'reset';
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  className?: string;
  ripple?: boolean;
  rounded?: boolean;
  shadow?: boolean;
  pulse?: boolean;
  as?: React.ElementType;
  href?: string;
  target?: '_blank' | '_self' | '_parent' | '_top';
  rel?: string;
  'aria-label'?: string;
}

export const EnhancedButton: React.FC<EnhancedButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled = false,
  loading = false,
  type = 'button',
  leftIcon,
  rightIcon,
  onClick,
  className,
  ripple = true,
  rounded = false,
  shadow = true,
  pulse = false,
  as: Component = 'button',
  href,
  target,
  rel,
  'aria-label': ariaLabel,
  ...props
}) => {
  const [isPressed, setIsPressed] = useState(false);
  const [ripples, setRipples] = useState<Array<{ id: number; x: number; y: number }>>([]);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const rippleIdRef = useRef(0);

  const getBaseClasses = () => {
    const base = [
      'relative',
      'inline-flex',
      'items-center',
      'justify-center',
      'gap-2',
      'font-medium',
      'transition-all',
      'duration-300',
      'ease-in-out',
      'focus:outline-none',
      'focus:ring-2',
      'focus:ring-offset-2',
      'focus:ring-primary/50',
      'disabled:opacity-50',
      'disabled:cursor-not-allowed',
      'disabled:transform-none',
      'whitespace-nowrap',
      'select-none',
      'user-select-none',
      'touch-manipulation',
    ];

    // Size variants
    const sizeClasses = {
      sm: 'px-3 py-2 text-sm rounded-lg',
      md: 'px-4 py-3 text-base rounded-xl',
      lg: 'px-6 py-4 text-lg rounded-2xl',
    };

    // Variant styles
    const variantClasses = {
      primary: [
        'bg-gradient-to-r',
        'from-primary',
        'to-primary/80',
        'text-white',
        'border',
        'border-primary/30',
        'hover:from-primary',
        'hover:to-primary',
        'hover:shadow-lg',
        'hover:shadow-primary/20',
        'hover:-translate-y-0.5',
        'active:translate-y-0',
        'active:scale-95',
        'focus:shadow-primary/30',
      ],
      secondary: [
        'bg-gradient-to-r',
        'from-secondary',
        'to-secondary/80',
        'text-white',
        'border',
        'border-secondary/30',
        'hover:from-secondary',
        'hover:to-secondary',
        'hover:shadow-lg',
        'hover:shadow-secondary/20',
        'hover:-translate-y-0.5',
        'active:translate-y-0',
        'active:scale-95',
        'focus:shadow-secondary/30',
      ],
      ghost: [
        'bg-transparent',
        'text-text',
        'border',
        'border-border',
        'hover:bg-surface',
        'hover:border-border-hover',
        'hover:text-text',
        'active:bg-surface-hover',
        'active:scale-98',
      ],
      outline: [
        'bg-transparent',
        'text-primary',
        'border',
        'border-primary',
        'hover:bg-primary/10',
        'hover:text-primary',
        'active:bg-primary/20',
        'active:scale-98',
      ],
      danger: [
        'bg-gradient-to-r',
        'from-error',
        'to-error/80',
        'text-white',
        'border',
        'border-error/30',
        'hover:from-error',
        'hover:to-error',
        'hover:shadow-lg',
        'hover:shadow-error/20',
        'hover:-translate-y-0.5',
        'active:translate-y-0',
        'active:scale-95',
        'focus:shadow-error/30',
      ],
      success: [
        'bg-gradient-to-r',
        'from-success',
        'to-success/80',
        'text-white',
        'border',
        'border-success/30',
        'hover:from-success',
        'hover:to-success',
        'hover:shadow-lg',
        'hover:shadow-success/20',
        'hover:-translate-y-0.5',
        'active:translate-y-0',
        'active:scale-95',
        'focus:shadow-success/30',
      ],
      warning: [
        'bg-gradient-to-r',
        'from-warning',
        'to-warning/80',
        'text-white',
        'border',
        'border-warning/30',
        'hover:from-warning',
        'hover:to-warning',
        'hover:shadow-lg',
        'hover:shadow-warning/20',
        'hover:-translate-y-0.5',
        'active:translate-y-0',
        'active:scale-95',
        'focus:shadow-warning/30',
      ],
    };

    // State modifiers
    const stateClasses = [
      isPressed && !disabled && !loading && 'transform scale-98 translate-y-0.5',
      pulse && !disabled && !loading && 'animate-pulse',
      shadow && 'shadow-md',
      rounded && 'rounded-full',
      fullWidth && 'w-full',
      disabled && 'cursor-not-allowed opacity-60',
      loading && 'cursor-wait',
    ].filter(Boolean);

    return clsx(
      base,
      sizeClasses[size],
      variantClasses[variant],
      stateClasses,
      className
    );
  };

  const handleMouseDown = () => {
    if (!disabled && !loading) {
      setIsPressed(true);
    }
  };

  const handleMouseUp = () => {
    setIsPressed(false);
  };

  const handleMouseLeave = () => {
    setIsPressed(false);
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || loading) {
      e.preventDefault();
      return;
    }

    if (ripple) {
      createRipple(e);
    }

    onClick?.(e);
  };

  const createRipple = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!buttonRef.current || disabled || loading) return;

    const rect = buttonRef.current.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;

    const newRipple = {
      id: ++rippleIdRef.current,
      x,
      y,
    };

    setRipples(prev => [...prev, newRipple]);

    // Remove ripple after animation
    setTimeout(() => {
      setRipples(prev => prev.filter(ripple => ripple.id !== newRipple.id));
    }, 600);
  };

  // Handle ripple cleanup on unmount
  useEffect(() => {
    return () => {
      setRipples([]);
    };
  }, []);

  const commonProps = {
    ref: buttonRef as React.RefObject<HTMLButtonElement>,
    disabled: disabled || loading,
    className: getBaseClasses(),
    onMouseDown: handleMouseDown,
    onMouseUp: handleMouseUp,
    onMouseLeave: handleMouseLeave,
    onClick: handleClick,
    'aria-label': ariaLabel || (typeof children === 'string' ? children : undefined),
    'aria-disabled': disabled || loading,
    'aria-busy': loading,
    ...props,
  };

  const content = (
    <>
      {/* Loading Spinner */}
      {loading && (
        <svg
          className={clsx(
            'animate-spin',
            size === 'sm' ? 'w-4 h-4' : size === 'md' ? 'w-5 h-5' : 'w-6 h-6',
            'text-current'
          )}
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}

      {/* Left Icon */}
      {leftIcon && !loading && (
        <span
          className={clsx(
            'transition-all',
            'duration-300',
            loading ? 'opacity-0 scale-75' : 'opacity-100 scale-100'
          )}
        >
          {leftIcon}
        </span>
      )}

      {/* Button Text */}
      <span
        className={clsx(
          'transition-all',
          'duration-300',
          loading ? 'opacity-0 translate-x-2' : 'opacity-100 translate-x-0'
        )}
      >
        {children}
      </span>

      {/* Right Icon */}
      {rightIcon && !loading && (
        <span
          className={clsx(
            'transition-all',
            'duration-300',
            loading ? 'opacity-0 scale-75' : 'opacity-100 scale-100'
          )}
        >
          {rightIcon}
        </span>
      )}

      {/* Ripple Effect */}
      {ripple && ripples.length > 0 && (
        <span className="absolute inset-0 overflow-hidden rounded-lg">
          {ripples.map((ripple) => (
            <span
              key={ripple.id}
              className="absolute bg-white/30 rounded-full transform -translate-x-1/2 -translate-y-1/2 animate-ripple"
              style={{
                left: ripple.x,
                top: ripple.y,
                width: '20px',
                height: '20px',
                animationDuration: '0.6s',
              }}
            />
          ))}
        </span>
      )}
    </>
  );

  // Render as anchor if href is provided
  if (href) {
    return (
      <a
        {...(commonProps as any)}
        href={href}
        target={target}
        rel={rel}
        className={clsx(commonProps.className, 'no-underline')}
      >
        {content}
      </a>
    );
  }

  // Render as button
  return (
    <Component
      {...commonProps}
      type={type}
    >
      {content}
    </Component>
  );
};

// Keyframe animation for ripple effect
const style = document.createElement('style');
style.textContent = `
  @keyframes ripple {
    0% {
      transform: scale(0);
      opacity: 1;
    }
    100% {
      transform: scale(4);
      opacity: 0;
    }
  }
  .animate-ripple {
    animation: ripple 0.6s linear;
  }
`;
document.head.appendChild(style);