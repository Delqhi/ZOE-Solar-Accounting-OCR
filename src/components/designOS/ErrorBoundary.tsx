/**
 * designOS Error Boundary
 * Graceful error handling with designOS styling
 */

import { Component, ReactNode } from 'react';
import { Card } from './Card';
import { Button } from './Button';
import { Stack } from './Layout';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo });
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  private handleRefresh = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '400px',
            padding: 'var(--spacing-lg)',
          }}
        >
          <Card variant="elevated" padding="xl" style={{ maxWidth: '600px', width: '100%' }}>
            <Stack gap="lg">
              {/* Error Icon */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  width: '64px',
                  height: '64px',
                  backgroundColor: 'rgba(255, 71, 87, 0.1)',
                  borderRadius: 'var(--radius-full)',
                  margin: '0 auto',
                }}
              >
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--color-error)"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>

              {/* Error Title */}
              <div style={{ textAlign: 'center' }}>
                <h2
                  style={{
                    margin: 0,
                    fontSize: 'var(--font-size-xl)',
                    color: 'var(--color-text)',
                    fontWeight: 600,
                  }}
                >
                  Something went wrong
                </h2>
                <p
                  style={{
                    margin: 'var(--spacing-sm) 0 0 0',
                    color: 'var(--color-text-muted)',
                    fontSize: 'var(--font-size-sm)',
                  }}
                >
                  We encountered an unexpected error. Please try again.
                </p>
              </div>

              {/* Error Details (Development Only) */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div
                  style={{
                    backgroundColor: 'var(--color-surface)',
                    padding: 'var(--spacing-md)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: 'var(--font-size-xs)',
                    fontFamily: 'var(--font-family-mono)',
                    overflow: 'auto',
                    maxHeight: '200px',
                  }}
                >
                  <div style={{ color: 'var(--color-error)', fontWeight: 600, marginBottom: 'var(--spacing-xs)' }}>
                    {this.state.error.name}: {this.state.error.message}
                  </div>
                  {this.state.errorInfo && (
                    <div style={{ color: 'var(--color-text-muted)' }}>
                      {this.state.errorInfo.componentStack}
                    </div>
                  )}
                </div>
              )}

              {/* Actions */}
              <div
                style={{
                  display: 'flex',
                  gap: 'var(--spacing-sm)',
                  justifyContent: 'center',
                }}
              >
                <Button variant="primary" onClick={this.handleReset}>
                  Try Again
                </Button>
                <Button variant="ghost" onClick={this.handleRefresh}>
                  Refresh Page
                </Button>
              </div>
            </Stack>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Loading Spinner Component
export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'accent';
  label?: string;
}

const spinnerSizes = {
  sm: '20px',
  md: '40px',
  lg: '60px',
};

const spinnerColors = {
  primary: 'var(--color-primary)',
  secondary: 'var(--color-secondary)',
  accent: 'var(--color-accent)',
};

export function LoadingSpinner({ 
  size = 'md', 
  variant = 'primary',
  label,
}: LoadingSpinnerProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 'var(--spacing-md)',
      }}
    >
      <div
        style={{
          width: spinnerSizes[size],
          height: spinnerSizes[size],
          border: `3px solid var(--color-surface)`,
          borderTop: `3px solid ${spinnerColors[variant]}`,
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }}
      />
      {label && (
        <span
          style={{
            color: 'var(--color-text-muted)',
            fontSize: 'var(--font-size-sm)',
          }}
        >
          {label}
        </span>
      )}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

// Suspense-like Loading Wrapper
export interface LoadingWrapperProps {
  isLoading: boolean;
  children: ReactNode;
  loadingComponent?: ReactNode;
  fallback?: ReactNode;
}

export function LoadingWrapper({
  isLoading,
  children,
  loadingComponent = <LoadingSpinner size="md" label="Loading..." />,
  fallback = null,
}: LoadingWrapperProps) {
  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '200px',
        }}
      >
        {loadingComponent}
      </div>
    );
  }

  return <>{children || fallback}</>;
}

// Skeleton Loading Component
export interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  variant?: 'text' | 'circle' | 'rectangle';
  className?: string;
}

export function Skeleton({ 
  width = '100%', 
  height = '20px',
  variant = 'text',
  className = '',
}: SkeletonProps) {
  const baseStyle = {
    backgroundColor: 'var(--color-surface)',
    borderRadius: variant === 'circle' ? '50%' : 'var(--radius-sm)',
    animation: 'pulse 1.5s ease-in-out infinite',
  };

  const sizeStyle = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
  };

  const variantStyle = variant === 'text' 
    ? { height: '1em', marginBottom: '0.5em' }
    : {};

  return (
    <>
      <div
        className={className}
        style={{
          ...baseStyle,
          ...sizeStyle,
          ...variantStyle,
        }}
      />
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </>
  );
}

// Skeleton Group for multiple loading items
export function SkeletonGroup({ count = 3 }: { count?: number }) {
  return (
    <Stack gap="md">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} variant="text" width={`${80 - (i * 15)}%`} />
      ))}
    </Stack>
  );
}