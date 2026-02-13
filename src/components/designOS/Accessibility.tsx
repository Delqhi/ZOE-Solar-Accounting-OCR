/**
 * 2026 GLASSMORPHISM 2.0 - ADVANCED ACCESSIBILITY SYSTEM
 * WCAG 2.2 AA compliant with advanced ARIA, focus management, and assistive tech support
 * Version: 2026.0 | Source: 2026 Best Practices
 */

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';

export interface AccessibilityConfig {
  skipLinks: boolean;
  focusIndicator: boolean;
  reduceMotion: boolean;
  highContrast: boolean;
  screenReaderMode: boolean;
  keyboardNavigation: boolean;
  voiceNavigation: boolean;
}

export interface AccessibilityState {
  config: AccessibilityConfig;
  focusVisible: boolean;
  reducedMotion: boolean;
  highContrast: boolean;
  screenReaderActive: boolean;
  keyboardNavigation: boolean;
  voiceNavigation: boolean;
}

export interface AccessibilityActions {
  setConfig: (config: Partial<AccessibilityConfig>) => void;
  toggleReducedMotion: () => void;
  toggleHighContrast: () => void;
  toggleScreenReaderMode: () => void;
  focusElement: (element: HTMLElement | string) => void;
  announce: (message: string, priority?: 'polite' | 'assertive') => void;
  scrollToElement: (element: HTMLElement | string, options?: ScrollIntoViewOptions) => void;
}

const AccessibilityContext = createContext<{
  state: AccessibilityState;
  actions: AccessibilityActions;
} | null>(null);

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within AccessibilityProvider');
  }
  return context;
};

export const AccessibilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AccessibilityState>({
    config: {
      skipLinks: true,
      focusIndicator: true,
      reduceMotion: false,
      highContrast: false,
      screenReaderMode: false,
      keyboardNavigation: true,
      voiceNavigation: false
    },
    focusVisible: false,
    reducedMotion: false,
    highContrast: false,
    screenReaderActive: false,
    keyboardNavigation: false,
    voiceNavigation: false
  });

  // Initialize accessibility settings
  useEffect(() => {
    // Check for reduced motion preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setState(prev => ({
      ...prev,
      reducedMotion: mediaQuery.matches,
      config: { ...prev.config, reduceMotion: mediaQuery.matches }
    }));

    // Check for high contrast mode
    const contrastQuery = window.matchMedia('(prefers-contrast: high)');
    setState(prev => ({
      ...prev,
      highContrast: contrastQuery.matches,
      config: { ...prev.config, highContrast: contrastQuery.matches }
    }));

    // Monitor focus changes
    const handleFocus = () => setState(prev => ({ ...prev, focusVisible: true }));
    const handleBlur = () => setState(prev => ({ ...prev, focusVisible: false }));

    window.addEventListener('focus', handleFocus, true);
    window.addEventListener('blur', handleBlur, true);

    return () => {
      window.removeEventListener('focus', handleFocus, true);
      window.removeEventListener('blur', handleBlur, true);
    };
  }, []);

  const actions: AccessibilityActions = {
    setConfig: useCallback((config) => {
      setState(prev => ({
        ...prev,
        config: { ...prev.config, ...config }
      }));
    }, []),

    toggleReducedMotion: useCallback(() => {
      setState(prev => ({
        ...prev,
        reducedMotion: !prev.reducedMotion,
        config: { ...prev.config, reduceMotion: !prev.reducedMotion }
      }));
    }, []),

    toggleHighContrast: useCallback(() => {
      setState(prev => ({
        ...prev,
        highContrast: !prev.highContrast,
        config: { ...prev.config, highContrast: !prev.highContrast }
      }));
    }, []),

    toggleScreenReaderMode: useCallback(() => {
      setState(prev => ({
        ...prev,
        screenReaderActive: !prev.screenReaderActive,
        config: { ...prev.config, screenReaderMode: !prev.screenReaderActive }
      }));
    }, []),

    focusElement: useCallback((elementOrId) => {
      const element = typeof elementOrId === 'string'
        ? document.getElementById(elementOrId)
        : elementOrId;

      if (element) {
        element.focus({ preventScroll: false });
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, []),

    announce: useCallback((message, priority = 'polite') => {
      const announcer = document.getElementById('accessibility-announcer');
      if (announcer) {
        announcer.setAttribute('aria-live', priority);
        announcer.textContent = message;
        // Clear after announcement
        setTimeout(() => {
          announcer.textContent = '';
        }, 1000);
      }
    }, []),

    scrollToElement: useCallback((elementOrId, options = { behavior: 'smooth', block: 'center' as const }) => {
      const element = typeof elementOrId === 'string'
        ? document.getElementById(elementOrId)
        : elementOrId;

      if (element) {
        element.scrollIntoView(options);
        element.focus({ preventScroll: true });
      }
    }, [])
  };

  return (
    <AccessibilityContext.Provider value={{ state, actions }}>
      {children}
    </AccessibilityContext.Provider>
  );
};

// Accessibility hooks and utilities
export const useFocusManagement = () => {
  const { actions } = useAccessibility();
  const focusRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (focusRef.current) {
      actions.focusElement(focusRef.current);
    }
  }, [actions]);

  return { focusRef };
};

export const useAriaLive = () => {
  const { actions } = useAccessibility();

  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    actions.announce(message, priority);
  }, [actions]);

  return { announce };
};

export const useKeyboardNavigation = () => {
  const { state, actions } = useAccessibility();
  const [activeElement, setActiveElement] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!state.config.keyboardNavigation) return;

      switch (e.key) {
        case 'Tab':
          // Enhanced tab navigation with focus indicators
          if (e.shiftKey) {
            // Shift+Tab: Move backwards
            e.preventDefault();
            const focusableElements = document.querySelectorAll(
              'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            ) as NodeListOf<HTMLElement>;
            const currentIndex = Array.from(focusableElements).indexOf(e.target as HTMLElement);
            const nextIndex = Math.max(0, currentIndex - 1);
            focusableElements[nextIndex]?.focus();
          }
          break;

        case 'ArrowUp':
        case 'ArrowDown':
        case 'ArrowLeft':
        case 'ArrowRight':
          // Directional navigation for grids and lists
          handleDirectionalNavigation(e);
          break;

        case 'Enter':
        case ' ':
          // Activate current element
          if (activeElement) {
            activeElement.click();
          }
          break;

        case 'Escape':
          // Close modals and dialogs
          const modal = document.querySelector('[role="dialog"][aria-modal="true"]');
          if (modal) {
            const closeButton = modal.querySelector('[data-close]');
            closeButton?.dispatchEvent(new Event('click'));
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state.config.keyboardNavigation, activeElement]);

  const handleDirectionalNavigation = (e: KeyboardEvent) => {
    const target = e.target as HTMLElement;
    const parent = target.closest('[data-navigation="grid"]') || target.closest('[role="grid"]');

    if (parent) {
      const items = parent.querySelectorAll('[data-navigation-item]') as NodeListOf<HTMLElement>;
      const currentIndex = Array.from(items).indexOf(target);
      let nextIndex = currentIndex;

      switch (e.key) {
        case 'ArrowDown':
          nextIndex = Math.min(currentIndex + 1, items.length - 1);
          break;
        case 'ArrowUp':
          nextIndex = Math.max(currentIndex - 1, 0);
          break;
        case 'ArrowRight':
          nextIndex = Math.min(currentIndex + 3, items.length - 1);
          break;
        case 'ArrowLeft':
          nextIndex = Math.max(currentIndex - 3, 0);
          break;
      }

      if (nextIndex !== currentIndex) {
        e.preventDefault();
        items[nextIndex]?.focus();
      }
    }
  };

  return { setActiveElement };
};

export const useScreenReaderSupport = () => {
  const { state, actions } = useAccessibility();
  const [srText, setSrText] = useState('');

  useEffect(() => {
    if (state.screenReaderActive) {
      // Enhance screen reader experience
      const elements = document.querySelectorAll('[aria-label], [title], [data-sr]');
      elements.forEach(el => {
        const target = el as HTMLElement;
        if (!target.getAttribute('aria-label')) {
          const srLabel = target.getAttribute('data-sr') || target.getAttribute('title');
          if (srLabel) {
            target.setAttribute('aria-label', srLabel);
          }
        }
      });
    }
  }, [state.screenReaderActive]);

  const describeElement = useCallback((element: HTMLElement, description: string) => {
    element.setAttribute('aria-describedby', description);
  }, []);

  const markAsLoading = useCallback((element: HTMLElement) => {
    element.setAttribute('aria-busy', 'true');
    element.setAttribute('aria-label', 'Loading...');
  }, []);

  const markAsLoaded = useCallback((element: HTMLElement) => {
    element.removeAttribute('aria-busy');
    element.removeAttribute('aria-label');
  }, []);

  return {
    describeElement,
    markAsLoading,
    markAsLoaded,
    srText,
    setSrText
  };
};

// Accessibility components
export const SkipLink: React.FC<{ href: string; children: React.ReactNode }> = ({ href, children }) => {
  const { state } = useAccessibility();

  if (!state.config.skipLinks) return null;

  return (
    <a
      href={href}
      className="skip-link"
      style={{
        position: 'absolute',
        left: '-9999px',
        top: 'auto',
        width: '1px',
        height: '1px',
        overflow: 'hidden',
        zIndex: 9999,
        background: '#000',
        color: '#fff',
        padding: '1rem',
        textDecoration: 'none',
        borderRadius: '4px',
        transition: 'all 0.3s ease'
      }}
      onFocus={(e) => {
        e.currentTarget.style.left = '20px';
        e.currentTarget.style.top = '20px';
      }}
      onBlur={(e) => {
        e.currentTarget.style.left = '-9999px';
        e.currentTarget.style.top = 'auto';
      }}
    >
      {children}
    </a>
  );
};

export const FocusIndicator: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { state } = useAccessibility();

  return (
    <div
      className={`focus-indicator ${state.focusVisible ? 'focus-visible' : ''}`}
      style={{
        outline: state.focusVisible && state.config.focusIndicator
          ? '2px solid #00D4FF'
          : 'none',
        outlineOffset: '2px',
        borderRadius: '4px'
      }}
    >
      {children}
    </div>
  );
};

export const LiveRegion: React.FC<{
  children: React.ReactNode;
  priority?: 'polite' | 'assertive';
  id?: string;
}> = ({ children, priority = 'polite', id = 'accessibility-announcer' }) => {
  return (
    <div
      id={id}
      role="status"
      aria-live={priority}
      aria-atomic="true"
      style={{ position: 'absolute', left: '-9999px', width: '1px', height: '1px', overflow: 'hidden' }}
    >
      {children}
    </div>
  );
};

export const AccessibleButton: React.FC<{
  children: React.ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  disabled?: boolean;
  className?: string;
  ariaLabel?: string;
  keyboardShortcut?: string;
}> = ({ children, onClick, variant = 'primary', disabled = false, className, ariaLabel, keyboardShortcut }) => {
  const { state } = useAccessibility();

  const buttonClass = `
    accessible-button
    ${className || ''}
    ${state.config.highContrast ? 'high-contrast' : ''}
    ${disabled ? 'disabled' : ''}
  `;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (!disabled) onClick();
    }
  };

  return (
    <button
      className={buttonClass}
      onClick={disabled ? undefined : onClick}
      onKeyDown={handleKeyDown}
      disabled={disabled}
      aria-label={ariaLabel}
      aria-disabled={disabled}
      role="button"
      tabIndex={disabled ? -1 : 0}
      style={{
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition: state.reducedMotion ? 'none' : 'all 0.3s ease',
        ...(state.config.highContrast && {
          background: '#000',
          color: '#fff',
          border: '2px solid #fff'
        })
      }}
    >
      {children}
      {keyboardShortcut && (
        <span
          className="keyboard-shortcut"
          style={{
            marginLeft: '8px',
            fontSize: '10px',
            opacity: 0.6,
            fontFamily: 'monospace'
          }}
          aria-hidden="true"
        >
          {keyboardShortcut}
        </span>
      )}
    </button>
  );
};

export const AccessibleInput: React.FC<{
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: 'text' | 'email' | 'password' | 'number';
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  helpText?: string;
  required?: boolean;
  className?: string;
}> = ({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  disabled = false,
  error,
  helpText,
  required = false,
  className
}) => {
  const { state } = useAccessibility();
  const inputId = `input-${Math.random().toString(36).substr(2, 9)}`;
  const helpId = helpText ? `help-${inputId}` : undefined;
  const errorId = error ? `error-${inputId}` : undefined;

  return (
    <div className={`accessible-input ${className || ''}`}>
      <label
        htmlFor={inputId}
        className="input-label"
        style={{
          display: 'block',
          marginBottom: '8px',
          fontWeight: '600',
          color: state.config.highContrast ? '#fff' : '#333'
        }}
      >
        {label}
        {required && (
          <span aria-label="required" style={{ color: '#d32f2f', marginLeft: '4px' }}>*</span>
        )}
      </label>

      <input
        id={inputId}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        aria-describedby={helpId || errorId || undefined}
        aria-invalid={!!error}
        aria-required={required}
        className="input-field"
        style={{
          width: '100%',
          padding: '12px 16px',
          borderRadius: '8px',
          border: `2px solid ${error ? '#d32f2f' : (state.config.highContrast ? '#fff' : '#ccc')}`,
          background: state.config.highContrast ? '#000' : '#fff',
          color: state.config.highContrast ? '#fff' : '#000',
          fontSize: '16px',
          transition: state.reducedMotion ? 'none' : 'all 0.3s ease',
          outline: 'none'
        }}
      />

      {helpText && (
        <div
          id={helpId}
          className="help-text"
          style={{
            marginTop: '4px',
            fontSize: '14px',
            color: state.config.highContrast ? '#ccc' : '#666'
          }}
        >
          {helpText}
        </div>
      )}

      {error && (
        <div
          id={errorId}
          className="error-text"
          role="alert"
          style={{
            marginTop: '4px',
            fontSize: '14px',
            color: '#d32f2f'
          }}
        >
          {error}
        </div>
      )}
    </div>
  );
};

export const AccessibleModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}> = ({ isOpen, onClose, title, children, size = 'md' }) => {
  const { state } = useAccessibility();
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement as HTMLElement;
      modalRef.current?.focus();
    } else {
      previousActiveElement.current?.focus();
    }

    // Trap focus within modal
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'Tab') {
        const focusableElements = modalRef.current?.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        ) as NodeListOf<HTMLElement>;

        if (focusableElements?.length) {
          const firstElement = focusableElements[0];
          const lastElement = focusableElements[focusableElements.length - 1];

          if (e.shiftKey) {
            if (document.activeElement === firstElement) {
              e.preventDefault();
              lastElement.focus();
            }
          } else {
            if (document.activeElement === lastElement) {
              e.preventDefault();
              firstElement.focus();
            }
          }
        }
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="accessible-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby={`modal-title-${title}`}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '20px'
      }}
    >
      <div
        ref={modalRef}
        className={`accessible-modal modal-size-${size}`}
        tabIndex={-1}
        style={{
          background: state.config.highContrast ? '#000' : 'rgba(255, 255, 255, 0.95)',
          borderRadius: '12px',
          boxShadow: state.config.highContrast
            ? '0 0 0 2px #fff'
            : '0 10px 30px rgba(0, 0, 0, 0.3)',
          maxWidth: size === 'xl' ? '900px' : size === 'lg' ? '700px' : size === 'md' ? '500px' : '300px',
          width: '100%',
          outline: 'none'
        }}
      >
        <div
          className="modal-header"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '20px',
            borderBottom: state.config.highContrast ? '2px solid #fff' : '1px solid #eee'
          }}
        >
          <h2 id={`modal-title-${title}`} style={{ margin: 0, fontSize: '24px' }}>
            {title}
          </h2>
          <AccessibleButton
            onClick={onClose}
            ariaLabel="Close modal"
            keyboardShortcut="Esc"
            variant="ghost"
            style={{ fontSize: '24px', padding: '4px 8px' }}
          >
            ×
          </AccessibleButton>
        </div>
        <div
          className="modal-content"
          style={{ padding: '20px' }}
        >
          {children}
        </div>
      </div>
    </div>
  );
};

// Export all accessibility components and hooks
export {
  AccessibilityProvider,
  useAccessibility,
  useFocusManagement,
  useAriaLive,
  useKeyboardNavigation,
  useScreenReaderSupport,
  SkipLink,
  FocusIndicator,
  LiveRegion,
  AccessibleButton,
  AccessibleInput,
  AccessibleModal
};