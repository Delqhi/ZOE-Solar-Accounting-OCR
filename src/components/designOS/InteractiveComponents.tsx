/**
 * 2026 GLASSMORPHISM 2.0 - MICRO-INTERACTION COMPONENTS
 * Advanced interactive components with haptic feedback and smooth animations
 * Version: 2026.0 | Source: 2026 Best Practices
 */

import React, { useRef, useEffect, useState } from 'react';
import { useMicroInteractions, MicroInteractionUtils } from '../../hooks/useMicroInteractions';
import { AccessibleButton, AccessibleInput } from '../Accessibility';
import { DepthCard, FloatingElement } from './depth3D';
import { TypographyBody } from './typography';

export interface InteractiveButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  intensity?: 'subtle' | 'medium' | 'strong';
  haptic?: boolean;
  ripple?: boolean;
  glow?: boolean;
  children: React.ReactNode;
}

export const InteractiveButton: React.FC<InteractiveButtonProps> = ({
  variant = 'primary',
  size = 'md',
  intensity = 'medium',
  haptic = true,
  ripple = true,
  glow = true,
  children,
  onClick,
  className = '',
  ...props
}) => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const { useButtonInteraction } = useMicroInteractions({
    hapticEnabled: haptic,
    visualEnabled: true,
    audioEnabled: false
  });

  const [ripples, setRipples] = useState<Array<{ id: number; x: number; y: number }>>([]);
  const rippleIdRef = useRef(0);

  useButtonInteraction(buttonRef);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (ripple) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const newRipple = { id: rippleIdRef.current++, x, y };
      setRipples(prev => [...prev, newRipple]);

      setTimeout(() => {
        setRipples(prev => prev.filter(r => r.id !== newRipple.id));
      }, 600);
    }

    if (onClick) {
      onClick(e);
    }
  };

  const getButtonStyles = () => {
    const baseStyles = {
      position: 'relative',
      overflow: 'hidden',
      cursor: 'pointer',
      transition: 'all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
      transform: 'translateZ(0)', // Enable hardware acceleration
      backfaceVisibility: 'hidden'
    };

    const sizeStyles = {
      sm: { padding: '8px 16px', fontSize: '14px', borderRadius: '8px' },
      md: { padding: '12px 24px', fontSize: '16px', borderRadius: '12px' },
      lg: { padding: '16px 32px', fontSize: '18px', borderRadius: '16px' }
    };

    const variantStyles = {
      primary: {
        background: 'linear-gradient(135deg, rgba(0, 102, 255, 0.8), rgba(0, 212, 255, 0.6))',
        color: 'white',
        border: '1px solid rgba(0, 102, 255, 0.3)'
      },
      secondary: {
        background: 'linear-gradient(135deg, rgba(255, 107, 87, 0.8), rgba(255, 176, 32, 0.6))',
        color: 'white',
        border: '1px solid rgba(255, 107, 87, 0.3)'
      },
      ghost: {
        background: 'rgba(255, 255, 255, 0.05)',
        color: '#E6EDF3',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      },
      danger: {
        background: 'linear-gradient(135deg, rgba(255, 71, 87, 0.8), rgba(255, 119, 136, 0.6))',
        color: 'white',
        border: '1px solid rgba(255, 71, 87, 0.3)'
      },
      success: {
        background: 'linear-gradient(135deg, rgba(0, 204, 102, 0.8), rgba(0, 255, 136, 0.6))',
        color: 'white',
        border: '1px solid rgba(0, 204, 102, 0.3)'
      }
    };

    return {
      ...baseStyles,
      ...sizeStyles[size],
      ...variantStyles[variant],
      ...(glow && {
        boxShadow: intensity === 'strong'
          ? '0 8px 24px rgba(0, 102, 255, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
          : intensity === 'medium'
          ? '0 4px 16px rgba(0, 102, 255, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
          : '0 2px 8px rgba(0, 102, 255, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
      })
    };
  };

  return (
    <button
      ref={buttonRef}
      onClick={handleClick}
      style={getButtonStyles()}
      className={`interactive-button ${className}`}
      {...props}
    >
      {children}

      {/* Ripple Effect */}
      {ripples.map(ripple => (
        <span
          key={ripple.id}
          className="ripple"
          style={{
            position: 'absolute',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.6)',
            transform: 'scale(0)',
            animation: 'ripple-animation 0.6s ease-out',
            left: ripple.x,
            top: ripple.y,
            width: '20px',
            height: '20px',
            margin: '-10px 0 0 -10px',
            pointerEvents: 'none'
          }}
        />
      ))}

      <style jsx>{`
        @keyframes ripple-animation {
          to {
            transform: scale(4);
            opacity: 0;
          }
        }

        .interactive-button {
          &:hover {
            transform: translateY(-2px) scale(1.02);
            filter: brightness(1.1);
          }

          &:active {
            transform: translateY(0) scale(0.98);
            filter: brightness(0.95);
          }
        }
      `}</style>
    </button>
  );
};

export interface InteractiveInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  intensity?: 'subtle' | 'medium' | 'strong';
  haptic?: boolean;
  glow?: boolean;
  floatingLabel?: boolean;
}

export const InteractiveInput: React.FC<InteractiveInputProps> = ({
  label,
  helperText,
  error,
  intensity = 'medium',
  haptic = true,
  glow = true,
  floatingLabel = true,
  className = '',
  ...props
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [hasValue, setHasValue] = useState(!!props.value || !!props.defaultValue);

  const { useInputInteraction } = useMicroInteractions({
    hapticEnabled: haptic,
    visualEnabled: true,
    audioEnabled: false
  });

  useInputInteraction(inputRef);

  const handleFocus = () => {
    setIsFocused(true);
    if (props.onFocus) props.onFocus();
  };

  const handleBlur = () => {
    setIsFocused(false);
    if (props.onBlur) props.onBlur();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setHasValue(e.target.value.length > 0);
    if (props.onChange) props.onChange(e);
  };

  const getInputStyles = () => {
    const baseStyles = {
      width: '100%',
      padding: '14px 16px',
      fontSize: '16px',
      color: '#E6EDF3',
      background: 'rgba(255, 255, 255, 0.05)',
      border: `1px solid ${error ? 'rgba(255, 71, 87, 0.5)' : 'rgba(255, 255, 255, 0.1)'}`,
      borderRadius: '12px',
      transition: 'all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
      outline: 'none',
      backdropFilter: 'blur(4px)',
      WebkitBackdropFilter: 'blur(4px)'
    };

    const focusStyles = isFocused ? {
      borderColor: error ? 'rgba(255, 71, 87, 0.8)' : 'rgba(0, 212, 255, 0.6)',
      boxShadow: glow ? intensity === 'strong'
        ? '0 0 0 4px rgba(0, 212, 255, 0.2), 0 8px 24px rgba(0, 212, 255, 0.3)'
        : intensity === 'medium'
        ? '0 0 0 3px rgba(0, 212, 255, 0.15), 0 4px 16px rgba(0, 212, 255, 0.2)'
        : '0 0 0 2px rgba(0, 212, 255, 0.1), 0 2px 8px rgba(0, 212, 255, 0.15)'
        : 'none',
      background: 'rgba(255, 255, 255, 0.08)'
    } : {};

    const errorStyles = error ? {
      borderColor: 'rgba(255, 71, 87, 0.6)',
      boxShadow: '0 0 0 2px rgba(255, 71, 87, 0.2)'
    } : {};

    return {
      ...baseStyles,
      ...focusStyles,
      ...errorStyles
    };
  };

  return (
    <div className={`interactive-input-container ${className}`}>
      {label && floatingLabel ? (
        <label
          style={{
            position: 'absolute',
            left: '16px',
            top: isFocused || hasValue ? '6px' : '50%',
            transform: isFocused || hasValue ? 'translateY(0)' : 'translateY(-50%)',
            fontSize: isFocused || hasValue ? '12px' : '16px',
            color: isFocused ? '#00D4FF' : error ? '#FF4757' : '#A7B0BD',
            transition: 'all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
            pointerEvents: 'none',
            background: 'transparent',
            padding: '0 4px'
          }}
        >
          {label}
        </label>
      ) : label && (
        <TypographyBody style={{ marginBottom: '8px', fontWeight: 600 }}>
          {label}
        </TypographyBody>
      )}

      <input
        ref={inputRef}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onChange={handleChange}
        style={getInputStyles()}
        {...props}
      />

      {helperText && !error && (
        <TypographyBody style={{ fontSize: '12px', color: '#A7B0BD', marginTop: '4px' }}>
          {helperText}
        </TypographyBody>
      )}

      {error && (
        <TypographyBody style={{ fontSize: '12px', color: '#FF4757', marginTop: '4px' }}>
          {error}
        </TypographyBody>
      )}
    </div>
  );
};

export interface InteractiveCardProps extends React.HTMLAttributes<HTMLDivElement> {
  depth?: number;
  hoverEffect?: boolean;
  clickEffect?: boolean;
  haptic?: boolean;
  glow?: boolean;
  floating?: boolean;
  children: React.ReactNode;
}

export const InteractiveCard: React.FC<InteractiveCardProps> = ({
  depth = 2,
  hoverEffect = true,
  clickEffect = true,
  haptic = true,
  glow = true,
  floating = true,
  children,
  className = '',
  onClick,
  ...props
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isPressed, setIsPressed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const { triggerInteraction } = useMicroInteractions({
    hapticEnabled: haptic,
    visualEnabled: true,
    audioEnabled: false
  });

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (clickEffect && haptic) {
      triggerInteraction(cardRef.current!, {
        haptic: { type: 'light' }
      });
    }
    if (onClick) onClick(e);
  };

  const handleMouseDown = () => {
    if (clickEffect) {
      setIsPressed(true);
      if (haptic) {
        triggerInteraction(cardRef.current!, {
          haptic: { type: 'light' }
        });
      }
    }
  };

  const handleMouseUp = () => {
    if (clickEffect) {
      setIsPressed(false);
    }
  };

  const handleMouseEnter = () => {
    if (hoverEffect) {
      setIsHovered(true);
      if (haptic) {
        triggerInteraction(cardRef.current!, {
          haptic: { type: 'light' }
        });
      }
    }
  };

  const handleMouseLeave = () => {
    if (hoverEffect) {
      setIsHovered(false);
    }
  };

  const getCardStyles = () => {
    const baseStyles = {
      position: 'relative',
      cursor: 'pointer',
      transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
      transform: floating ? 'translateZ(0)' : 'none',
      backfaceVisibility: 'hidden'
    };

    const depthStyles = {
      transform: isPressed ? 'translateY(2px) scale(0.98)' :
                isHovered ? 'translateY(-4px) scale(1.02)' : 'translateY(0) scale(1)',
      boxShadow: glow ? isPressed
        ? '0 4px 16px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
        : isHovered
        ? `0 ${depth * 8}px ${depth * 16}px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)`
        : `0 ${depth * 4}px ${depth * 8}px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)`
        : 'none'
    };

    return {
      ...baseStyles,
      ...depthStyles
    };
  };

  return (
    <div
      ref={cardRef}
      style={getCardStyles()}
      className={`interactive-card ${className}`}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      {children}
    </div>
  );
};

export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  thickness?: number;
  variant?: 'circular' | 'pulse' | 'orbit';
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  color = '#00D4FF',
  thickness = 3,
  variant = 'circular'
}) => {
  const getSpinnerStyles = () => {
    const sizeMap = {
      sm: { width: '24px', height: '24px' },
      md: { width: '32px', height: '32px' },
      lg: { width: '48px', height: '48px' }
    };

    const baseStyles = {
      ...sizeMap[size],
      border: `${thickness}px solid rgba(255, 255, 255, 0.1)`,
      borderTop: `${thickness}px solid ${color}`,
      borderRadius: '50%',
      animation: 'spin 1s linear infinite',
      display: 'inline-block'
    };

    return baseStyles;
  };

  return (
    <div style={getSpinnerStyles()} className="loading-spinner">
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  onClose?: () => void;
}

export const Toast: React.FC<ToastProps> = ({
  message,
  type = 'info',
  duration = 3000,
  onClose
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => {
        if (onClose) onClose();
      }, 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const getToastStyles = () => {
    const typeStyles = {
      success: {
        background: 'linear-gradient(135deg, rgba(0, 204, 102, 0.2), rgba(0, 255, 136, 0.1))',
        border: '1px solid rgba(0, 204, 102, 0.3)',
        color: '#00CC66'
      },
      error: {
        background: 'linear-gradient(135deg, rgba(255, 71, 87, 0.2), rgba(255, 119, 136, 0.1))',
        border: '1px solid rgba(255, 71, 87, 0.3)',
        color: '#FF4757'
      },
      warning: {
        background: 'linear-gradient(135deg, rgba(255, 176, 32, 0.2), rgba(255, 215, 0, 0.1))',
        border: '1px solid rgba(255, 176, 32, 0.3)',
        color: '#FFB020'
      },
      info: {
        background: 'linear-gradient(135deg, rgba(0, 102, 255, 0.2), rgba(0, 212, 255, 0.1))',
        border: '1px solid rgba(0, 102, 255, 0.3)',
        color: '#0066FF'
      }
    };

    return {
      position: 'fixed',
      top: '20px',
      right: '20px',
      padding: '16px 20px',
      borderRadius: '12px',
      backdropFilter: 'blur(8px)',
      zIndex: 9999,
      transform: isVisible ? 'translateX(0)' : 'translateX(100%)',
      opacity: isVisible ? 1 : 0,
      transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
      ...typeStyles[type]
    };
  };

  return (
    <div style={getToastStyles()} className="toast">
      <TypographyBody>{message}</TypographyBody>
      <style jsx>{`
        .toast {
          &:hover {
            transform: translateX(-4px) translateY(-4px);
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
          }
        }
      `}</style>
    </div>
  );
};

export default {
  Button: InteractiveButton,
  Input: InteractiveInput,
  Card: InteractiveCard,
  LoadingSpinner,
  Toast
};