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
    supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
    supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
    geminiApiKey: import.meta.env.VITE_GEMINI_API_KEY,
    siliconFlowApiKey: import.meta.env.VITE_SILICONFLOW_API_KEY,
    sentryDsn: import.meta.env.VITE_SENTRY_DSN,
    appVersion: import.meta.env.VITE_APP_VERSION,
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
    // eslint-disable-next-line no-console
    console.error('❌ Missing environment variables:');
    // eslint-disable-next-line no-console
    errors.forEach(err => console.error(`   - ${err}`));

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
    return import.meta.env.VITE_GEMINI_API_ENDPOINT || 'https://generativelanguage.googleapis.com/v1beta';
  }

  if (service === 'siliconflow') {
    return import.meta.env.VITE_SILICONFLOW_API_ENDPOINT || 'https://api.siliconflow.com/v1';
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
    'sentry-monitoring': import.meta.env.PROD && !!import.meta.env.VITE_SENTRY_DSN,
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
 */
export function logConfigSummary(): void {
  if (!import.meta.env.DEV) return;

  const config = loadEnvConfig();
  const env = getEnvironmentConfig();

  // eslint-disable-next-line no-console
  console.log('📋 Configuration Summary:');
  // eslint-disable-next-line no-console
  console.log('  Environment:', env.environment);
  // eslint-disable-next-line no-console
  console.log('  API URL:', env.apiUrl);
  // eslint-disable-next-line no-console
  console.log('  Debug Mode:', env.debug);
  // eslint-disable-next-line no-console
  console.log('  OCR Timeout:', env.ocrTimeout, 'ms');
  // eslint-disable-next-line no-console
  console.log('  Max File Size:', (env.maxFileSize / (1024 * 1024)), 'MB');
  // eslint-disable-next-line no-console
  console.log('  Features:', {
    duplicateDetection: isFeatureEnabled('advanced-duplicate-detection'),
    mlVendorMapping: isFeatureEnabled('ml-vendor-mapping'),
    bulkExport: isFeatureEnabled('bulk-export'),
    sentry: isFeatureEnabled('sentry-monitoring'),
  });

  // Mask sensitive keys
  // eslint-disable-next-line no-console
  console.log('  Supabase URL:', config.supabaseUrl ? '✅' : '❌');
  // eslint-disable-next-line no-console
  console.log('  Gemini API Key:', config.geminiApiKey ? '✅ (masked)' : '❌');
  // eslint-disable-next-line no-console
  console.log('  SiliconFlow Key:', config.siliconFlowApiKey ? '✅ (masked)' : '⚠️ (optional)');
}

/**
 * Get app metadata for error reporting
 */
export function getAppMetadata() {
  return {
    name: 'ZOE Solar Accounting OCR',
    version: import.meta.env.VITE_APP_VERSION || 'dev',
    buildTime: import.meta.env.VITE_BUILD_TIME || new Date().toISOString(),
    environment: import.meta.env.MODE,
    userAgent: navigator.userAgent,
    viewport: `${window.innerWidth}x${window.innerHeight}`,
  };
}
