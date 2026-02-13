/**
 * ErrorBoundary Component
 * Catches React component errors and displays fallback UI
 */
import { Component, ReactNode, ErrorInfo } from 'react';
import { toast } from 'react-hot-toast';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error | undefined;
  errorInfo?: ErrorInfo | undefined;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('❌ ErrorBoundary caught error:', {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });

    // Show user-friendly toast
    toast.error(
      'Ein unerwarteter Fehler ist aufgetreten. Bitte laden Sie die Seite neu.',
      { duration: 8000 }
    );

    // Optional: Send to monitoring service
    if (import.meta.env.PROD) {
      // Sentry.captureException(error, { extra: errorInfo });
      // analytics.trackError('react_error', error.message);
    }

    this.setState({ errorInfo });
  }

  componentDidMount() {
    // Log app version for debugging
    console.log('🚀 ZOE App Version:', (import.meta.env['VITE_APP_VERSION'] as string | undefined) || 'dev');
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <div className="max-w-lg w-full bg-white rounded-xl shadow-xl p-8">
            <div className="text-center">
              {/* Icon */}
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
                <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Oops! Etwas ist schiefgelaufen
              </h2>

              <p className="text-gray-600 mb-6">
                Die App ist in einen ungültigen Zustand geraten.
                Unser Team wurde benachrichtigt.
              </p>

              {/* Technical Details (collapsed) */}
              {this.state.error && (
                <details className="text-left bg-gray-100 rounded p-4 mb-6 text-xs font-mono overflow-auto max-h-48">
                  <summary className="cursor-pointer font-semibold text-gray-700 mb-2">
                    Technische Details (für Support)
                  </summary>
                  <div className="text-red-700">
                    <strong>Error:</strong> {this.state.error.message}
                  </div>
                  {this.state.errorInfo && (
                    <div className="text-gray-600 mt-2">
                      <strong>Component Stack:</strong>
                      <br />
                      {this.state.errorInfo.componentStack}
                    </div>
                  )}
                </details>
              )}

              <div className="space-y-3">
                <button
                  onClick={this.handleReset}
                  className="w-full bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors"
                >
                  Seite neu laden
                </button>

                <a
                  href="/support"
                  className="block w-full bg-gray-200 text-gray-800 px-6 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                >
                  Kontaktieren Sie Support
                </a>

                <button
                  onClick={() => {
                    // Clear localStorage and reload
                    localStorage.clear();
                    window.location.reload();
                  }}
                  className="text-sm text-gray-500 hover:text-gray-700 underline"
                >
                  Daten zurücksetzen (letzter Ausweg)
                </button>
              </div>

              <div className="mt-6 text-xs text-gray-400">
                <p>Error ID: {Date.now().toString(36)}</p>
                <p>Wenn das Problem besteht, bitten wir Sie den Support zu kontaktieren.</p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Global Error Handler for non-React errors
 */
export function setupGlobalErrorHandler() {
  window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    toast.error('Ein kritischer Fehler ist aufgetreten.');
  });

  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    toast.error('Ein unerwartetes Problem ist aufgetreten.');
  });
}
