/**
 * designOS Toast Notification System
 * Toast notifications with variants and animations
 */

import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';
export type ToastPosition = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';

export interface ToastProps {
  id: string;
  message: string;
  variant?: ToastVariant;
  duration?: number;
  onClose: (id: string) => void;
  position?: ToastPosition;
}

const variantStyles: Record<ToastVariant, { bg: string; icon: React.ReactNode; border: string }> = {
  success: {
    bg: 'rgba(0, 204, 102, 0.1)',
    border: 'var(--color-success)',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" strokeWidth="2">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    ),
  },
  error: {
    bg: 'rgba(255, 71, 87, 0.1)',
    border: 'var(--color-error)',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-error)" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <line x1="15" y1="9" x2="9" y2="15" />
        <line x1="9" y1="9" x2="15" y2="15" />
      </svg>
    ),
  },
  warning: {
    bg: 'rgba(255, 176, 32, 0.1)',
    border: 'var(--color-warning)',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-warning)" strokeWidth="2">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
  },
  info: {
    bg: 'rgba(0, 102, 255, 0.1)',
    border: 'var(--color-primary)',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="16" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12.01" y2="8" />
      </svg>
    ),
  },
};

const positionStyles: Record<ToastPosition, React.CSSProperties> = {
  'top-right': { top: 'var(--spacing-lg)', right: 'var(--spacing-lg)' },
  'top-left': { top: 'var(--spacing-lg)', left: 'var(--spacing-lg)' },
  'bottom-right': { bottom: 'var(--spacing-lg)', right: 'var(--spacing-lg)' },
  'bottom-left': { bottom: 'var(--spacing-lg)', left: 'var(--spacing-lg)' },
  'top-center': { top: 'var(--spacing-lg)', left: '50%', transform: 'translateX(-50%)' },
  'bottom-center': { bottom: 'var(--spacing-lg)', left: '50%', transform: 'translateX(-50%)' },
};

export function Toast({ id, message, variant = 'info', duration = 5000, onClose, position = 'top-right' }: ToastProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, id, onClose]);

  const handleClose = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      onClose(id);
    }, 300);
  }, [id, onClose]);

  if (!isVisible) return null;

  const style = variantStyles[variant];

  return createPortal(
    <div
      style={{
        position: 'fixed',
        ...positionStyles[position],
        zIndex: 1000,
        minWidth: '300px',
        maxWidth: '500px',
        backgroundColor: 'var(--color-surface)',
        border: `1px solid ${style.border}`,
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--spacing-md)',
        boxShadow: 'var(--shadow-lg)',
        display: 'flex',
        gap: 'var(--spacing-md)',
        alignItems: 'flex-start',
        animation: isExiting ? 'toast-exit 0.3s ease forwards' : 'toast-enter 0.3s ease',
        backdropFilter: 'blur(10px)',
      }}
    >
      <div
        style={{
          width: '24px',
          height: '24px',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {style.icon}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 'var(--font-size-sm)',
            fontWeight: 500,
            color: 'var(--color-text)',
            lineHeight: '1.4',
          }}
        >
          {message}
        </div>
      </div>

      <button
        onClick={handleClose}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '0',
          width: '20px',
          height: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--color-text-muted)',
          transition: 'color 0.2s ease',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-text)')}
        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text-muted)')}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>

      <style>{`
        @keyframes toast-enter {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes toast-exit {
          from {
            opacity: 1;
            transform: translateY(0);
          }
          to {
            opacity: 0;
            transform: translateY(-20px);
          }
        }
      `}</style>
    </div>,
    document.body
  );
}

// Toast Manager Hook
export interface UseToastReturn {
  showToast: (message: string, variant?: ToastVariant, duration?: number, position?: ToastPosition) => void;
  hideToast: (id: string) => void;
  ToastContainer: React.FC;
}

export function useToast(): UseToastReturn {
  const [toasts, setToasts] = useState<Array<{ id: string; message: string; variant: ToastVariant; duration: number; position: ToastPosition }>>([]);

  const showToast = useCallback((message: string, variant: ToastVariant = 'info', duration: number = 5000, position: ToastPosition = 'top-right') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setToasts((prev) => [...prev, { id, message, variant, duration, position }]);
  }, []);

  const hideToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const ToastContainer = useCallback(() => {
    return (
      <>
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            id={toast.id}
            message={toast.message}
            variant={toast.variant}
            duration={toast.duration}
            position={toast.position}
            onClose={hideToast}
          />
        ))}
      </>
    );
  }, [toasts, hideToast]);

  return { showToast, hideToast, ToastContainer };
}

// Toast Provider Component
export interface ToastProviderProps {
  children: React.ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const { ToastContainer, ...toastMethods } = useToast();

  // Make toast methods available via context if needed
  (window as any).toast = toastMethods;

  return (
    <>
      {children}
      <ToastContainer />
    </>
  );
}

// Pre-configured toast functions
export function createToastAPI(showToast: UseToastReturn['showToast']) {
  return {
    success: (message: string, duration?: number, position?: ToastPosition) => 
      showToast(message, 'success', duration, position),
    error: (message: string, duration?: number, position?: ToastPosition) => 
      showToast(message, 'error', duration, position),
    warning: (message: string, duration?: number, position?: ToastPosition) => 
      showToast(message, 'warning', duration, position),
    info: (message: string, duration?: number, position?: ToastPosition) => 
      showToast(message, 'info', duration, position),
  };
}