/**
 * Performance Monitor
 * Tracks app performance metrics and logs warnings
 */

export interface PerformanceMetrics {
  appStartup: number;
  domContentLoaded: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  cumulativeLayoutShift: number;
  interactionToNextPaint: number;
}

export class PerformanceMonitor {
  private static metrics: Partial<PerformanceMetrics> = {};
  private static startTime: number = performance.now();

  // Private constructor to prevent instantiation
  private constructor() {
    throw new Error('PerformanceMonitor is a static class and cannot be instantiated');
  }

  /**
   * Get current timestamp in milliseconds
   * Used by server actions to track operation start times
   */
  static now(): number {
    return performance.now();
  }

  /**
   * Initialize performance monitoring
   */
  static init(): void {
    this.monitorAppStartup();
    this.monitorWebVitals();
    this.monitorMemoryUsage();
  }

  /**
   * Monitor application startup time
   */
  private static monitorAppStartup(): void {
    // Mark app start
    if (typeof performance !== 'undefined' && performance.mark) {
      performance.mark('app-start');
    }

    // Measure until first render
    if (typeof PerformanceObserver !== 'undefined') {
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.name === 'react-render') {
              this.metrics.appStartup = entry.duration;
              console.log(`⚡ App Startup: ${entry.duration.toFixed(2)}ms`);
            }
          }
        });
        observer.observe({ entryTypes: ['measure'] });
      } catch (e) {
        // Browser doesn't support this entry type
      }
    }
  }

  /**
   * Monitor Core Web Vitals
   */
  private static monitorWebVitals(): void {
    if (typeof PerformanceObserver !== 'undefined' && 'PerformanceObserver' in window) {
      // First Contentful Paint
      try {
        const fcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            if (entry.name === 'first-contentful-paint') {
              this.metrics.firstContentfulPaint = entry.startTime;
              console.log(`🎨 First Contentful Paint: ${entry.startTime.toFixed(2)}ms`);
            }
          });
        });
        fcpObserver.observe({ entryTypes: ['paint'] });
      } catch (e) {}

      // Largest Contentful Paint
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          this.metrics.largestContentfulPaint = lastEntry.startTime;
          console.log(`🖼️ Largest Contentful Paint: ${lastEntry.startTime.toFixed(2)}ms`);
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      } catch (e) {}

      // Cumulative Layout Shift
      try {
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          }
          this.metrics.cumulativeLayoutShift = clsValue;
          if (clsValue > 0.1) {
            console.warn(`⚠️ Layout Shift: ${clsValue.toFixed(4)} (needs improvement)`);
          }
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
      } catch (e) {}
    }
  }

  /**
   * Monitor memory usage (if available)
   */
  private static monitorMemoryUsage(): void {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      if (memory) {
        const usedMB = (memory.usedJSHeapSize / 1048576).toFixed(2);
        const totalMB = (memory.totalJSHeapSize / 1048576).toFixed(2);
        console.log(`💾 Memory Usage: ${usedMB}MB / ${totalMB}MB`);

        // Warn if using more than 100MB
        if (memory.usedJSHeapSize > 100 * 1048576) {
          console.warn('⚠️ High memory usage detected');
        }
      }
    }
  }

  /**
   * Measure operation duration
   */
  static measure<T>(name: string, fn: () => T): T {
    const start = performance.now();
    const result = fn();
    const end = performance.now();
    const duration = end - start;

    console.log(`⏱️ ${name}: ${duration.toFixed(2)}ms`);

    // Warn if operation takes longer than 100ms
    if (duration > 100) {
      console.warn(`⚠️ Slow operation: ${name} took ${duration.toFixed(2)}ms`);
    }

    return result;
  }

  /**
   * Measure async operation duration
   */
  static async measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now();
    const result = await fn();
    const end = performance.now();
    const duration = end - start;

    console.log(`⏱️ ${name}: ${duration.toFixed(2)}ms`);

    // Warn if operation takes longer than 500ms
    if (duration > 500) {
      console.warn(`⚠️ Slow async operation: ${name} took ${duration.toFixed(2)}ms`);
    }

    return result;
  }

  /**
   * Get current performance metrics
   */
  static getMetrics(): PerformanceMetrics {
    return {
      appStartup: this.metrics.appStartup || 0,
      domContentLoaded: this.metrics.domContentLoaded || 0,
      firstContentfulPaint: this.metrics.firstContentfulPaint || 0,
      largestContentfulPaint: this.metrics.largestContentfulPaint || 0,
      cumulativeLayoutShift: this.metrics.cumulativeLayoutShift || 0,
      interactionToNextPaint: this.metrics.interactionToNextPaint || 0,
    };
  }

  /**
   * Log summary of all metrics
   */
  static logSummary(): void {
    const metrics = this.getMetrics();
    console.group('📊 Performance Summary');
    Object.entries(metrics).forEach(([key, value]) => {
      if (value > 0) {
        console.log(`${key}: ${value.toFixed(2)}ms`);
      }
    });
    console.groupEnd();
  }

  /**
   * Check if performance is within acceptable thresholds
   */
  static isPerformant(): boolean {
    const metrics = this.getMetrics();

    return (
      metrics.appStartup < 2000 && // App should start in under 2 seconds
      metrics.firstContentfulPaint < 3000 && // FCP should be under 3 seconds
      metrics.largestContentfulPaint < 4000 && // LCP should be under 4 seconds
      metrics.cumulativeLayoutShift < 0.1 // CLS should be under 0.1
    );
  }

  /**
   * Record a performance metric with metadata
   * Used by App.tsx to track operation performance
   */
  static recordMetric(
    metricName: string,
    metadata: {
      operationId: string;
      duration: number;
      error?: string;
      [key: string]: any;
    }
  ): void {
    const { operationId, duration, error, ...rest } = metadata;

    console.log(`📊 ${metricName}`);
    console.log(`  operationId: ${operationId}`);
    console.log(`  duration: ${duration}ms`);

    if (error) {
      console.log(`  error: ${error}`);
    }

    // Log any additional metadata fields
    Object.entries(rest).forEach(([key, value]) => {
      console.log(`  ${key}: ${value}`);
    });
  }
}

// Export for use in other files
export const perf = PerformanceMonitor;
