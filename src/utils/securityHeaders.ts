/**
 * Security Headers Manager
 * Applies Content Security Policy and other security headers
 */

export class SecurityHeaders {
  /**
   * Apply all security headers to the document
   */
  static apply(): void {
    this.applyCSP();
    this.applyHSTS();
    this.applyFrameOptions();
    this.applyContentTypeOptions();
    this.applyReferrerPolicy();
    this.applyPermissionsPolicy();
    this.applyXSSProtection();
  }

  /**
   * Content Security Policy - Prevents XSS and injection attacks
   */
  private static applyCSP(): void {
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Vite dev needs unsafe-eval
      "style-src 'self' 'unsafe-inline'", // Tailwind needs inline styles
      "img-src 'self' data: https: blob:",
      "font-src 'self' data: https:",
      "connect-src 'self' https: wss:",
      "frame-src 'none'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; ');

    this.setHeader('Content-Security-Policy', csp);
  }

  /**
   * HTTP Strict Transport Security
   */
  private static applyHSTS(): void {
    this.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }

  /**
   * X-Frame-Options - Prevent clickjacking
   */
  private static applyFrameOptions(): void {
    this.setHeader('X-Frame-Options', 'DENY');
  }

  /**
   * X-Content-Type-Options - Prevent MIME sniffing
   */
  private static applyContentTypeOptions(): void {
    this.setHeader('X-Content-Type-Options', 'nosniff');
  }

  /**
   * Referrer Policy - Privacy protection
   */
  private static applyReferrerPolicy(): void {
    this.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  }

  /**
   * Permissions Policy - Feature control
   */
  private static applyPermissionsPolicy(): void {
    const policy = [
      'camera=()',
      'microphone=()',
      'geolocation=()',
      'payment=()',
      'usb=()',
      'serial=()',
      'bluetooth=()',
      'nfc=()',
    ].join(', ');

    this.setHeader('Permissions-Policy', policy);
  }

  /**
   * X-XSS-Protection (Legacy browsers)
   */
  private static applyXSSProtection(): void {
    this.setHeader('X-XSS-Protection', '1; mode=block');
  }

  /**
   * Helper to set header if it doesn't exist
   */
  private static setHeader(name: string, value: string): void {
    // Check if running in browser
    if (typeof document === 'undefined') return;

    // Only set if not already set
    if (!document.querySelector(`meta[http-equiv="${name}"]`)) {
      const meta = document.createElement('meta');
      meta.setAttribute('http-equiv', name);
      meta.setAttribute('content', value);
      document.head.appendChild(meta);
    }
  }

  /**
   * Get all security headers as an object
   */
  static getHeaders(): Record<string, string> {
    return {
      'Content-Security-Policy': [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: https: blob:",
        "font-src 'self' data: https:",
        "connect-src 'self' https: wss:",
        "frame-src 'none'",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
      ].join('; '),
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), serial=(), bluetooth=(), nfc=()',
      'X-XSS-Protection': '1; mode=block',
    };
  }

  /**
   * Validates current headers (for debugging)
   */
  static validate(): { valid: boolean; issues: string[] } {
    const issues: string[] = [];
    const required = [
      'Content-Security-Policy',
      'Strict-Transport-Security',
      'X-Frame-Options',
      'X-Content-Type-Options',
    ];

    const metaTags = document.querySelectorAll('meta[http-equiv]');
    const existing = Array.from(metaTags).map(tag => tag.getAttribute('http-equiv') || '');

    required.forEach(header => {
      if (!existing.includes(header)) {
        issues.push(`Missing security header: ${header}`);
      }
    });

    return {
      valid: issues.length === 0,
      issues,
    };
  }
}
