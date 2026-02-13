/**
 * Environment Configuration & Validation
 * Ensures all required environment variables are present
 */

interface EnvConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  geminiApiKey: string;
  siliconFlowApiKey?: string;
  sentryDsn?: string;
  appVersion?: string;
}

/**
 * Validates and loads environment variables
 */
export function loadEnvConfig(): EnvConfig {
  const config: EnvConfig = {
    supabaseUrl: import.meta.env['VITE_SUPABASE_URL'] as string,
    supabaseAnonKey: import.meta.env['VITE_SUPABASE_ANON_KEY'] as string,
    geminiApiKey: import.meta.env['VITE_GEMINI_API_KEY'] as string,
    siliconFlowApiKey: import.meta.env['VITE_SILICONFLOW_API_KEY'] as string | undefined,
    sentryDsn: import.meta.env['VITE_SENTRY_DSN'] as string | undefined,
    appVersion: import.meta.env['VITE_APP_VERSION'] as string | undefined,
  };

  const errors: string[] = [];

  // Required fields
  if (!config.supabaseUrl) {
    errors.push('VITE_SUPABASE_URL is required');
  }

  if (!config.supabaseAnonKey) {
    errors.push('VITE_SUPABASE_ANON_KEY is required');
  }

  if (!config.geminiApiKey) {
    errors.push('VITE_GEMINI_API_KEY is required');
  }

  // Log errors if any
  if (errors.length > 0) {
    console.error('❌ Missing environment variables:');
    errors.forEach((err) => console.error(`   - ${err}`));

    // Don't throw in development
    if (import.meta.env.PROD) {
      throw new Error('Configuration error: Missing required environment variables');
    }
  }

  return config;
}

/**
 * Get API endpoint with fallback
 */
export function getApiEndpoint(service: 'gemini' | 'siliconflow'): string {
  if (service === 'gemini') {
    return (
      (import.meta.env['VITE_GEMINI_API_ENDPOINT'] as string | undefined) ||
      'https://generativelanguage.googleapis.com/v1beta'
    );
  }

  if (service === 'siliconflow') {
    return (
      (import.meta.env['VITE_SILICONFLOW_API_ENDPOINT'] as string | undefined) ||
      'https://api.siliconflow.com/v1'
    );
  }

  return '';
}

/**
 * Feature flags for A/B testing or gradual rollout
 */
export function isFeatureEnabled(feature: string): boolean {
  const features = {
    'advanced-duplicate-detection': true,
    'ml-vendor-mapping': true,
    'bulk-export': true,
    'auto-backup': false, // Staged rollout
    'sentry-monitoring':
      import.meta.env.PROD && !!(import.meta.env['VITE_SENTRY_DSN'] as string | undefined),
  };

  return features[feature as keyof typeof features] || false;
}

/**
 * Get configuration for different environments
 */
export function getEnvironmentConfig() {
  const isDev = import.meta.env.DEV;
  const isProd = import.meta.env.PROD;

  return {
    environment: isDev ? 'development' : isProd ? 'production' : 'staging',
    apiUrl: isDev ? 'http://localhost:3000' : 'https://api.zoe-tax.de',
    debug: isDev,
    logLevel: isDev ? 'debug' : 'error',
    enableAnalytics: isProd,
    enableErrorReporting: isProd,
    ocrTimeout: isDev ? 60000 : 120000, // 2 min in prod
    maxFileSize: 50 * 1024 * 1024, // 50MB
  };
}

/**
 * Rate limit configuration
 */
export function getRateLimitConfig() {
  return {
    ocr: { limit: 5, window: 60000 }, // 5 per minute
    export: { limit: 10, window: 60000 }, // 10 per minute
    api: { limit: 20, window: 60000 }, // 20 per minute
    upload: { limit: 10, window: 60000 }, // 10 files per minute
  };
}

/**
 * Privacy configuration
 */
export function getPrivacyConfig() {
  return {
    dataRetentionDays: 2555, // 7 years for tax compliance
    enableAutoCleanup: import.meta.env.PROD,
    anonymizeLogs: import.meta.env.PROD,
    collectAnalytics: true,
    requireConsent: true,
  };
}

/**
 * Export configuration summary for debugging
 * Only logs in development mode with explicit opt-in
 */
export function logConfigSummary(): void {
  const config = loadEnvConfig();
  const env = getEnvironmentConfig();
  const debug = env.debug && import.meta.env.DEV;

  if (!debug) return;

  const log = (msg: string, ...args: unknown[]) => {
    if (debug) console.log(`[Config] ${msg}`, ...args);
  };

  log('Summary - Environment:', env.environment);
  log('API URL:', env.apiUrl);
  log('Debug Mode:', env.debug);
  log('OCR Timeout:', env.ocrTimeout, 'ms');
  log('Max File Size:', env.maxFileSize / (1024 * 1024), 'MB');

  log('Supabase URL:', config.supabaseUrl ? 'configured' : 'missing');
  log('Gemini API Key:', config.geminiApiKey ? 'configured' : 'missing');
  log('SiliconFlow Key:', config.siliconFlowApiKey ? 'configured' : 'optional');
}

/**
 * Get app metadata for error reporting
 */
export function getAppMetadata() {
  return {
    name: 'ZOE Solar Accounting OCR',
    version: (import.meta.env['VITE_APP_VERSION'] as string | undefined) || 'dev',
    buildTime:
      (import.meta.env['VITE_BUILD_TIME'] as string | undefined) || new Date().toISOString(),
    environment: import.meta.env.MODE,
    userAgent: navigator.userAgent,
    viewport: `${window.innerWidth}x${window.innerHeight}`,
  };
}
