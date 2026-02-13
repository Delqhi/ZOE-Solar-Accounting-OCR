/**
 * 🔱 ULTRA 2026 - Security Configuration
 * 11 security headers for production-grade protection
 * 
 * Implements:
 * - Content Security Policy (CSP) 2026 standard
 * - Permissions Policy (privacy-focused)
 * - Cross-Origin policies
 * - HSTS with preload
 * - Referrer policy
 * - MIME type protection
 * - Clickjacking prevention
 * - XSS protection
 */

export const SECURITY_HEADERS = {
  // Content Security Policy - 2026 Standard
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'wasm-unsafe-eval' 'inline-speculation-rules'",
    "style-src 'self' 'unsafe-inline'", // Tailwind requires inline
    "img-src 'self' blob: data: https://*.supabase.co",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; '),

  // Permissions Policy - Privacy First
  'Permissions-Policy': [
    'geolocation=()',        // No location access
    'camera=()',             // No camera access
    'microphone=()',         // No microphone access
    'payment=()',            // No payment API
    'usb=()',                // No USB access
    'fullscreen=()',         // No fullscreen auto
    'accelerometer=()',      // No motion sensors
    'gyroscope=()',          // No orientation sensors
  ].join(', '),

  // Cross-Origin Policies
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Embedder-Policy': 'require-corp',
  'Cross-Origin-Resource-Policy': 'same-origin',

  // Referrer Policy
  'Referrer-Policy': 'strict-origin-when-cross-origin',

  // MIME Type Protection
  'X-Content-Type-Options': 'nosniff',

  // Clickjacking Prevention
  'X-Frame-Options': 'DENY',

  // XSS Protection (Legacy browsers)
  'X-XSS-Protection': '1; mode=block',

  // HSTS - HTTPS Enforcement
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
} as const;

/**
 * Security configuration for Vercel deployment
 * Copy to vercel.json → headers array
 */
export const VERCEL_SECURITY_CONFIG = {
  headers: [
    {
      source: '/(.*)',
      headers: Object.entries(SECURITY_HEADERS).map(([key, value]) => ({
        key,
        value,
      })),
    },
  ],
};

/**
 * Security validation utilities
 */
export class SecurityValidator {
  /**
   * Validate CSP policy string
   */
  static validateCSP(csp: string): boolean {
    const required = ["default-src 'self'", "frame-ancestors 'none'"];
    return required.every(policy => csp.includes(policy));
  }

  /**
   * Validate security headers object
   */
  static validateHeaders(headers: Record<string, string>): boolean {
    const required = [
      'Content-Security-Policy',
      'Strict-Transport-Security',
      'X-Content-Type-Options',
      'X-Frame-Options',
    ];

    return required.every(header => 
      headers[header] && headers[header].length > 0
    );
  }

  /**
   * Check if current page has security headers
   */
  static async checkCurrentSecurity(): Promise<{
    missing: string[];
    valid: boolean;
  }> {
    if (typeof window === 'undefined') {
      return { missing: [], valid: true };
    }

    const missing: string[] = [];
    const meta = document.querySelector('meta[http-equiv]');
    
    // Check for CSP meta tag (fallback if headers fail)
    if (!meta) {
      missing.push('CSP Meta Tag');
    }

    return {
      missing,
      valid: missing.length === 0,
    };
  }
}

/**
 * Security event types for audit logging
 */
export type SecurityEvent = 
  | 'CSP_VIOLATION'
  | 'INVALID_INPUT_REJECTED'
  | 'UNAUTHORIZED_ACCESS_ATTEMPT'
  | 'XSS_ATTEMPT_DETECTED'
  | 'CSRF_ATTEMPT_DETECTED'
  | 'RATE_LIMIT_EXCEEDED';

/**
 * Security event logger
 */
export class SecurityEventLogger {
  static log(event: SecurityEvent, details: Record<string, unknown>): void {
    // In production, send to audit service
    if (import.meta.env.PROD) {
      fetch('/api/security-events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event,
          details,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href,
        }),
      }).catch(() => {
        // Fallback: store locally
        this.storeOffline(event, details);
      });
    } else {
      console.warn('[Security Event]', event, details);
    }
  }

  private static storeOffline(event: SecurityEvent, details: Record<string, unknown>): void {
    const events = JSON.parse(localStorage.getItem('security-events') || '[]');
    events.push({
      event,
      details,
      timestamp: Date.now(),
    });
    localStorage.setItem('security-events', JSON.stringify(events.slice(-100)));
  }
}
