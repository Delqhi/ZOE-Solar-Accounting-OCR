/**
 * Centralized logging utility for Chrome console logs
 * Provides environment-aware logging with sanitization
 */

interface LogConfig {
  level: 'debug' | 'info' | 'warn' | 'error' | 'silent';
  isDevelopment: boolean;
}

const config: LogConfig = {
  level: (import.meta.env.VITE_LOG_LEVEL as LogConfig['level']) || (import.meta.env.DEV ? 'debug' : 'error'),
  isDevelopment: import.meta.env.DEV,
};

/**
 * Sanitizes error objects to remove sensitive data
 */
function sanitizeError(error: unknown): string {
  if (!error) return '';

  if (error instanceof Error) {
    // Return only the message and stack trace (without sensitive data)
    const sanitized: any = {
      message: error.message,
      name: error.name,
    };
    // Include stack trace in development only
    if (config.isDevelopment && error.stack) {
      sanitized.stack = error.stack;
    }
    return JSON.stringify(sanitized, null, 2);
  }

  if (typeof error === 'object') {
    // Sanitize objects that might contain sensitive data
    try {
      const safeObj = { ...error };
      // Remove potential sensitive fields
      delete (safeObj as any).config;
      delete (safeObj as any).request;
      delete (safeObj as any).response;
      return JSON.stringify(safeObj, null, 2);
    } catch {
      return String(error);
    }
  }

  return String(error);
}

/**
 * Should this log level be output?
 */
function shouldLog(level: LogConfig['level']): boolean {
  const levels: LogConfig['level'][] = ['debug', 'info', 'warn', 'error', 'silent'];
  return levels.indexOf(config.level) <= levels.indexOf(level) && level !== 'silent';
}

/**
 * Enhanced console.error with sanitization and environment awareness
 * Always logs errors (never suppressed)
 */
export function loggerError(message: string, error?: unknown): void {
  if (config.level === 'silent') return;

  const sanitizedError = error ? sanitizeError(error) : '';
  const logMessage = sanitizedError ? `${message}\n${sanitizedError}` : message;

  console.error(logMessage);
}

/**
 * Enhanced console.warn - only logs in development or when level is warn/error
 * Use for non-critical issues that shouldn't spam production logs
 */
export function loggerWarn(message: string, error?: unknown): void {
  if (config.level === 'silent' || config.level === 'error') return;

  // Don't log sync failures in production (expected behavior)
  if (!config.isDevelopment && message.includes('sync')) {
    return;
  }

  const sanitizedError = error ? sanitizeError(error) : '';
  const logMessage = sanitizedError ? `${message}\n${sanitizedError}` : message;

  console.warn(logMessage);
}

/**
 * Enhanced console.info - only logs in development
 */
export function loggerInfo(message: string): void {
  if (config.level === 'silent' || config.level === 'error' || config.level === 'warn') return;
  if (!config.isDevelopment) return;

  console.info(message);
}

/**
 * Enhanced console.debug - only logs in development
 */
export function loggerDebug(message: string, data?: unknown): void {
  if (config.level !== 'debug' || !config.isDevelopment) return;

  if (data) {
    console.debug(message, data);
  } else {
    console.debug(message);
  }
}

/**
 * Main logger object for convenient usage
 */
export const logger = {
  error: loggerError,
  warn: loggerWarn,
  info: loggerInfo,
  debug: loggerDebug,
  // For setting log level at runtime (useful for testing)
  setLevel: (level: LogConfig['level']) => {
    config.level = level;
  },
  // Get current config
  getConfig: (): LogConfig => ({ ...config }),
};