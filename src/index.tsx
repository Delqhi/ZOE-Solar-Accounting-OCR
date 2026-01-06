/**
 * ZOE Solar Accounting OCR - Main Entry Point
 * Integrates: Error Boundaries, Context, Monitoring, Security
 */
import React from 'react';
import ReactDOM from 'react-dom/client';

// Components
import { ErrorBoundary, setupGlobalErrorHandler } from './components/ErrorBoundary';

// Context
import { AppProvider } from './context/AppContext';

// Services & Monitoring
import { performSecurityCheck } from './middleware/security';
import { monitoringService } from './services/monitoringService';
import { loadEnvConfig, logConfigSummary, getEnvironmentConfig } from './config/env';
import { analytics } from './lib/analytics';

// Styles
import './styles/global.css';

// Components (lazy loaded for performance)
const App = React.lazy(() => import('./App'));

// Initialize security first
performSecurityCheck();

// Setup global error handlers
setupGlobalErrorHandler();

// Log config (dev only)
logConfigSummary();

// Load environment config
const envConfig = loadEnvConfig();
const envMeta = getEnvironmentConfig();

// Setup performance monitoring
const originalFetch = window.fetch;
window.fetch = async (...args) => {
  const start = performance.now();
  try {
    const response = await originalFetch(...args);
    const duration = performance.now() - start;

    // Track API calls
    if (args[0].toString().includes('api')) {
      analytics.track('api_call', {
        url: args[0],
        duration: Math.round(duration),
        status: response.status,
      });
    }

    return response;
  } catch (error) {
    const duration = performance.now() - start;
    monitoringService.captureError(error, {
      url: args[0],
      duration: Math.round(duration),
      type: 'fetch_error',
    });
    throw error;
  }
};

// Root component wrapper
function Root() {
  React.useEffect(() => {
    // Track app load
    analytics.track('app_loaded', {
      version: envConfig.appVersion,
      environment: envMeta.environment,
    });

    // Track user agent
    analytics.track('user_agent', {
      ua: navigator.userAgent,
      platform: navigator.platform,
    });

    // Send performance metrics
    const navTiming = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navTiming) {
      analytics.trackPerformance('page_load', navTiming.loadEventEnd - navTiming.fetchStart);
    }

    // Cleanup on unload
    const handleUnload = () => {
      analytics.flush();
    };
    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, []);

  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Lade ZOE Solar Accounting OCR...</p>
            <p className="text-xs text-gray-400 mt-2">Version {envConfig.appVersion || 'dev'}</p>
          </div>
        </div>
      }
    >
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </React.Suspense>
  );
}

// Mount app
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Could not find root element');
}

const root = ReactDOM.createRoot(rootElement);

// Render with Context and Security
root.render(
  <React.StrictMode>
    <AppProvider>
      <Root />
    </AppProvider>
  </React.StrictMode>
);

// Export for testing
export { Root };
