/**
 * ZOE Solar Accounting OCR - Main Entry Point
 * React 19 Best Practices 2026
 *
 * Features:
 * - Environment validation
 * - Error boundaries
 * - Security headers
 * - Performance monitoring
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import { validateEnvironment } from './utils/environmentValidator';
import { SecurityHeaders } from './utils/securityHeaders';
import { PerformanceMonitor } from './utils/performanceMonitor';

// ========================================
// 🔒 SECURITY & ENVIRONMENT VALIDATION
// ========================================

/**
 * Validates all required environment variables before app starts
 * Prevents app from running with missing or invalid configuration
 */
function initializeApp(): void {
  try {
    // 1. Validate environment variables
    const envValidation = validateEnvironment();
    if (!envValidation.valid) {
      console.error('❌ Environment validation failed:', envValidation.errors);
      throw new Error(`Missing required environment variables: ${envValidation.errors.join(', ')}`);
    }

    // 2. Apply security headers
    SecurityHeaders.apply();

    // 3. Initialize performance monitoring
    PerformanceMonitor.init();

    console.log('✅ Environment validation passed');
    console.log('🔒 Security headers applied');
    console.log('⚡ Performance monitoring initialized');
  } catch (error) {
    console.error('❌ App initialization failed:', error);
    // Show user-friendly error message
    showErrorToUser(error);
    throw error;
  }
}

/**
 * Shows a user-friendly error message when initialization fails
 */
function showErrorToUser(error: unknown): void {
  const errorContainer = document.createElement('div');
  errorContainer.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: #1a1a1a;
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: system-ui, -apple-system, sans-serif;
    z-index: 9999;
    padding: 2rem;
  `;

  const errorMessage = document.createElement('div');
  errorMessage.style.cssText = `
    max-width: 600px;
    text-align: center;
  `;

  const errorDetails = error instanceof Error ? error.message : 'Unknown error';

  errorMessage.innerHTML = `
    <h1 style="color: #ef4444; margin-bottom: 1rem;">⚠️ Configuration Error</h1>
    <p style="margin-bottom: 1rem; line-height: 1.6;">
      The application cannot start due to missing or invalid configuration.
    </p>
    <details style="margin-top: 1rem; text-align: left; background: #2a2a2a; padding: 1rem; border-radius: 8px;">
      <summary style="cursor: pointer; font-weight: 600;">Technical Details</summary>
      <pre style="margin-top: 0.5rem; overflow-x: auto; font-size: 0.875rem;">${errorDetails}</pre>
    </details>
    <p style="margin-top: 1.5rem; font-size: 0.875rem; opacity: 0.8;">
      Please check your environment variables and ensure all required keys are set.<br>
      Contact your system administrator if this persists.
    </p>
  `;

  errorContainer.appendChild(errorMessage);
  document.body.appendChild(errorContainer);
}

// ========================================
// 🚀 APPLICATION STARTUP
// ========================================

// Run initialization before mounting React
initializeApp();

// Get root element
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element 'root' in HTML");
}

// Create React root
const root = ReactDOM.createRoot(rootElement);

// Render with Error Boundary for runtime errors
root.render(
  <React.StrictMode>
    <ErrorBoundary
      fallback={
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: '#1a1a1a',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          padding: '2rem'
        }}>
          <div style={{ maxWidth: '600px', textAlign: 'center' }}>
            <h1 style={{ color: '#ef4444', marginBottom: '1rem' }}>⚠️ Application Error</h1>
            <p style={{ marginBottom: '1rem', lineHeight: '1.6' }}>
              An unexpected error occurred. Please refresh the page.
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{
                background: '#3b82f6',
                color: '#fff',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: 600
              }}
            >
              Refresh Page
            </button>
          </div>
        </div>
      }
    >
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);

// ========================================
// 📊 PERFORMANCE & MONITORING
// ========================================

// Log app startup completion
console.log('%c🚀 ZOE Solar Accounting OCR Started', 'color: #3b82f6; font-size: 16px; font-weight: bold;');
console.log('%cVersion: 2026.1.0', 'color: #8b5cf6; font-size: 12px;');
console.log('%cReact 19 | Vite | TypeScript', 'color: #22c55e; font-size: 12px;');

// Register service worker for offline support (optional)
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').catch(err => {
    console.warn('Service Worker registration failed:', err);
  });
}

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled Promise Rejection:', event.reason);
  event.preventDefault();
});

// Handle uncaught errors
window.addEventListener('error', (event) => {
  console.error('Uncaught Error:', event.error);
  event.preventDefault();
});
