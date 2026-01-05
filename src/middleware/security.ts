/**
 * Security Middleware
 * Security headers, CSP, and protection measures
 */

/**
 * Returns Content Security Policy string
 * Prevents XSS, injection attacks
 */
export function getContentSecurityPolicy(): string {
  const csp = {
    'default-src': ["'self'"],
    'script-src': [
      "'self'",
      "'unsafe-inline'", // Required for some React patterns
      'https://www.google.com',
      'https://apis.google.com',
    ],
    'style-src': [
      "'self'",
      "'unsafe-inline'", // Tailwind requires this
    ],
    'connect-src': [
      "'self'",
      'https://*.supabase.co',
      'https://*.googleapis.com',
      'https://*.google.com',
      import.meta.env.VITE_SENTRY_DSN || '',
    ].filter(Boolean),
    'img-src': [
      "'self'",
      'data:',
      'blob:',
      'https://*.supabase.co',
    ],
    'font-src': [
      "'self'",
      'data:',
    ],
    'frame-src': [
      'https://www.google.com',
    ],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
  };

  return Object.entries(csp)
    .map(([key, values]) => `${key} ${values.join(' ')}`)
    .join('; ');
}

/**
 * Returns security headers for HTTP responses
 */
export function getSecurityHeaders(): Record<string, string> {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': "geolocation=(), camera=(), microphone=()",
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
    'Content-Security-Policy': getContentSecurityPolicy(),
  };
}

/**
 * Validates environment variables are set
 */
export function validateEnvironmentVariables(): void {
  const required = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY',
    'VITE_GEMINI_API_KEY',
  ];

  const missing = required.filter(key => !import.meta.env[key]);

  if (missing.length > 0) {
    const error = `Missing required environment variables: ${missing.join(', ')}`;
    console.error('❌ Security Error:', error);

    // Don't throw in dev mode
    if (import.meta.env.PROD) {
      throw new Error(error);
    }
  }
}

/**
 * Sanitizes HTML to prevent XSS
 */
export function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Sanitizes XML for export files
 */
export function escapeXml(text: string): string {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

/**
 * Validates file upload for security
 */
export function validateFileSecurity(file: File): { isValid: boolean; reason?: string } {
  // Check for double extensions
  if (file.name.match(/\\..*\\./)) {
    return { isValid: false, reason: 'Dateiname mit doppelter Erweiterung nicht erlaubt' };
  }

  // Check for suspicious patterns
  const suspicious = ['.exe', '.bat', '.sh', '.cmd', '.ps1', '.js', '.php'];
  const ext = file.name.toLowerCase().split('.').pop();

  if (ext && suspicious.includes(`.${ext}`)) {
    return { isValid: false, reason: 'Dateityp nicht erlaubt' };
  }

  // Check MIME type
  const validTypes = [
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
  ];

  if (!validTypes.includes(file.type) && !file.type.startsWith('image/')) {
    return { isValid: false, reason: 'Dateityp wird nicht unterstützt' };
  }

  return { isValid: true };
}

/**
 * Input sanitization for database operations
 */
export function sanitizeForDatabase(input: string): string {
  if (!input) return '';

  // Remove SQL injection patterns
  return input
    .replace(/'/g, "''") // Escape single quotes
    .replace(/--/g, '') // Remove SQL comment
    .replace(/;/g, '') // Remove statement terminators
    .replace(/\/\*/g, '') // Remove comment starts
    .trim();
}

/**
 * Generates secure random ID
 */
export function generateSecureId(length: number = 16): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Security check on app initialization
 */
export function performSecurityCheck(): void {
  console.log('🔒 Running security checks...');

  // Validate environment
  validateEnvironmentVariables();

  // Check for dev tools (optional - for anti-tampering)
  if (import.meta.env.PROD) {
    // Detect if console is open (basic check)
    const devtools = /./;
    devtools.toString = () => {
      window.location.reload(); // Simple anti-debug
      return '';
    };
  }

  // Log security info
  console.log('✅ Security checks passed');
  console.log(`🚀 Environment: ${import.meta.env.MODE}`);
  console.log(`🔒 Version: ${import.meta.env.VITE_APP_VERSION || 'dev'}`);
}

/**
 * Rate limiting for sensitive operations
 */
export function createOperationProtector(
  operation: string,
  cooldownMs: number = 5000
): { canExecute: () => boolean; reset: () => void } {
  let lastExecution = 0;

  return {
    canExecute: () => {
      const now = Date.now();
      if (now - lastExecution < cooldownMs) {
        console.warn(`Operation "${operation}" blocked by cooldown`);
        return false;
      }
      lastExecution = now;
      return true;
    },
    reset: () => {
      lastExecution = 0;
    },
  };
}

/**
 * Privacy-focused logging (no sensitive data)
 */
export function secureLog(message: string, data?: any): void {
  if (import.meta.env.DEV) {
    console.log(`[SECURE] ${message}`, data);
  } else {
    // In production, mask sensitive data
    const masked = data ? '[REDACTED]' : '';
    console.log(`[SECURE] ${message} ${masked}`);
  }
}
