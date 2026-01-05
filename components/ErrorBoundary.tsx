/**
 * Error Boundary Component
 * Catches and handles runtime errors in React component tree
 */

import React, { Component, ReactNode } from 'react';

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
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  /**
   * Update state when error occurs
   */
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  /**
   * Log error and call optional callback
   */
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Update state with error info
    this.setState({ errorInfo });

    // Log to console
    console.error('🚨 Error Boundary caught an error:', error, errorInfo);

    // Log to error tracking service (if available)
    this.logToService(error, errorInfo);

    // Call custom error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  /**
   * Log error to external service
   */
  private logToService(error: Error, errorInfo: React.ErrorInfo): void {
    // In production, send to error tracking service
    if (import.meta.env.PROD) {
      const errorData = {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
      };

      // You can integrate with Sentry, LogRocket, etc.
      console.log('Error tracking data:', errorData);
    }
  }

  /**
   * Reset error state (useful for retry actions)
   */
  resetError = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(135deg, #1a1a1a 0%, #2d1b3d 100%)',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          padding: '2rem',
          zIndex: 9999,
        }}>
          <div style={{
            maxWidth: '600px',
            background: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(10px)',
            padding: '2rem',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}>
            <div style={{ textAlign: 'center' }}>
              {/* Error Icon */}
              <div style={{
                width: '64px',
                height: '64px',
                margin: '0 auto 1rem',
                background: '#ef4444',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2rem',
              }}>
                ⚠️
              </div>

              <h1 style={{
                margin: '0 0 0.5rem',
                fontSize: '1.5rem',
                fontWeight: 700,
                color: '#ef4444',
              }}>
                Something went wrong
              </h1>

              <p style={{
                margin: '0 0 1.5rem',
                opacity: 0.8,
                lineHeight: '1.6',
              }}>
                An unexpected error occurred. Our team has been notified.
              </p>

              {/* Error Details (Collapsed) */}
              {this.state.error && (
                <details style={{
                  textAlign: 'left',
                  background: 'rgba(255, 255, 255, 0.05)',
                  padding: '1rem',
                  borderRadius: '8px',
                  marginBottom: '1.5rem',
                  fontSize: '0.875rem',
                }}>
                  <summary style={{ cursor: 'pointer', fontWeight: 600 }}>
                    Technical Details
                  </summary>
                  <div style={{ marginTop: '0.5rem', overflowX: 'auto' }}>
                    <div style={{ color: '#fca5a5', marginBottom: '0.5rem' }}>
                      {this.state.error.message}
                    </div>
                    {this.state.errorInfo && (
                      <pre style={{
                        margin: 0,
                        whiteSpace: 'pre-wrap',
                        fontSize: '0.75rem',
                        opacity: 0.7,
                      }}>
                        {this.state.errorInfo.componentStack}
                      </pre>
                    )}
                  </div>
                </details>
              )}

              {/* Action Buttons */}
              <div style={{
                display: 'flex',
                gap: '0.75rem',
                justifyContent: 'center',
              }}>
                <button
                  onClick={this.resetError}
                  style={{
                    background: '#3b82f6',
                    color: '#fff',
                    border: 'none',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    fontWeight: 600,
                    transition: 'background 0.2s',
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.background = '#2563eb')}
                  onMouseOut={(e) => (e.currentTarget.style.background = '#3b82f6')}
                >
                  Try Again
                </button>

                <button
                  onClick={() => window.location.reload()}
                  style={{
                    background: 'transparent',
                    color: '#fff',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    fontWeight: 600,
                    transition: 'border-color 0.2s',
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.borderColor = '#fff')}
                  onMouseOut={(e) => (e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)')}
                >
                  Refresh Page
                </button>
              </div>

              {/* Support Info */}
              <p style={{
                marginTop: '1.5rem',
                fontSize: '0.75rem',
                opacity: 0.6,
              }}>
                If this persists, please contact support with error ID.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Hook-based error boundary for functional components
 * (Alternative approach using useEffect and state)
 */
export function useErrorBoundary() {
  const [error, setError] = React.useState<Error | null>(null);

  const resetError = () => setError(null);

  const catchFn = (fn: () => void) => {
    try {
      fn();
    } catch (err) {
      setError(err as Error);
      console.error('Error caught in hook:', err);
    }
  };

  return { error, resetError, catchFn };
}
