/**
 * Analytics & Monitoring Service
 * Track app usage, performance, errors
 */

export interface AnalyticsEvent {
  event: string;
  properties?: Record<string, any>;
  timestamp: number;
}

export class Analytics {
  private static instance: Analytics;
  private events: AnalyticsEvent[] = [];
  private readonly maxEvents = 100; // Keep last 100 events in memory

  private constructor() {}

  static getInstance(): Analytics {
    if (!Analytics.instance) {
      Analytics.instance = new Analytics();
    }
    return Analytics.instance;
  }

  /**
   * Track a generic event
   */
  track(event: string, properties?: Record<string, any>): void {
    if (!import.meta.env.PROD) {
      console.log(`[Analytics] ${event}`, properties);
    }

    const analyticsEvent: AnalyticsEvent = {
      event,
      properties,
      timestamp: Date.now(),
    };

    this.events.push(analyticsEvent);

    // Keep memory in check
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents);
    }

    // Send to backend if in production
    if (import.meta.env.PROD) {
      this.sendToBackend(analyticsEvent);
    }
  }

  /**
   * OCR-specific tracking
   */
  trackOCRSuccess(duration: number, quality: number, provider: string): void {
    this.track('ocr_success', {
      duration_ms: duration,
      quality_score: quality,
      provider,
      success: true,
    });
  }

  trackOCRFailure(error: string, provider: string): void {
    this.track('ocr_failure', {
      error,
      provider,
      success: false,
    });
  }

  /**
   * Export tracking
   */
  trackExport(format: string, count: number, duration: number): void {
    this.track('export', {
      format,
      document_count: count,
      duration_ms: duration,
    });
  }

  trackExportFailure(format: string, error: string): void {
    this.track('export_failure', {
      format,
      error,
    });
  }

  /**
   * Upload tracking
   */
  trackUpload(files: number, totalSize: number): void {
    this.track('upload', {
      file_count: files,
      total_size_bytes: totalSize,
    });
  }

  trackUploadFailure(error: string): void {
    this.track('upload_failure', { error });
  }

  /**
   * Performance metrics
   */
  trackPerformance(metric: string, value: number, unit = 'ms'): void {
    this.track('performance', {
      metric,
      value,
      unit,
    });
  }

  /**
   * Error tracking
   */
  trackError(type: string, error: string, context?: any): void {
    this.track('error', {
      error_type: type,
      message: error,
      context,
    });
  }

  /**
   * User interaction tracking
   */
  trackInteraction(action: string, component: string, data?: any): void {
    this.track('interaction', {
      action,
      component,
      data,
    });
  }

  /**
   * Get all events (for debugging or batch send)
   */
  getEvents(): AnalyticsEvent[] {
    return [...this.events];
  }

  /**
   * Clear all events
   */
  clear(): void {
    this.events = [];
  }

  /**
   * Send to backend (placeholder)
   */
  private async sendToBackend(event: AnalyticsEvent): Promise<void> {
    try {
      // Would send to your analytics backend
      // fetch('/api/analytics', {
      //   method: 'POST',
      //   body: JSON.stringify(event),
      // });

      // For now, just log in dev
      if (import.meta.env.DEV) {
        console.log(`[Backend Analytics] Would send:`, event);
      }
    } catch (error) {
      console.warn('Analytics send failed:', error);
    }
  }

  /**
   * Batch send all events (call on app exit or periodically)
   */
  async flush(): Promise<void> {
    if (this.events.length === 0) return;

    const batch = [...this.events];
    this.events = [];

    // Send batch
    for (const event of batch) {
      await this.sendToBackend(event);
    }
  }
}

// Singleton instance
export const analytics = Analytics.getInstance();

// Performance observer wrapper
export function measurePerformance<T>(
  name: string,
  fn: () => Promise<T>
): Promise<T> {
  const start = performance.now();
  return fn().then(result => {
    const duration = performance.now() - start;
    analytics.trackPerformance(name, duration);
    return result;
  }).catch(error => {
    analytics.trackError('performance', `${name} failed: ${error}`);
    throw error;
  });
}

/**
 * React hook for analytics
 * Usage: const { track } = useAnalytics();
 */
export function useAnalytics() {
  const track = (event: string, properties?: Record<string, any>) => {
    analytics.track(event, properties);
  };

  return { track };
}
