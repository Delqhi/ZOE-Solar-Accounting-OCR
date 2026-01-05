/**
 * Monitoring Service
 * Error tracking and performance monitoring
 */

interface ErrorInfo {
  message: string;
  stack?: string;
  componentStack?: string;
  context?: any;
  timestamp: number;
}

interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: number;
}

class MonitoringService {
  private errors: ErrorInfo[] = [];
  private metrics: PerformanceMetric[] = [];
  private readonly maxLogs = 100;

  /**
   * Capture error
   */
  captureError(error: Error | string, context?: any): void {
    const errorInfo: ErrorInfo = {
      message: typeof error === 'string' ? error : error.message,
      stack: typeof error === 'string' ? undefined : error.stack,
      context,
      timestamp: Date.now(),
    };

    this.errors.push(errorInfo);

    if (this.errors.length > this.maxLogs) {
      this.errors = this.errors.slice(-this.maxLogs);
    }

    console.error('🚨 Captured Error:', errorInfo);

    // In production, send to external service
    if (import.meta.env.PROD) {
      this.sendToErrorService(errorInfo);
    }
  }

  /**
   * Capture performance metric
   */
  captureMetric(name: string, duration: number): void {
    const metric: PerformanceMetric = {
      name,
      duration,
      timestamp: Date.now(),
    };

    this.metrics.push(metric);

    if (this.metrics.length > this.maxLogs) {
      this.metrics = this.metrics.slice(-this.maxLogs);
    }

    console.log(`⚡ Metric: ${name} = ${duration.toFixed(2)}ms`);
  }

  /**
   * Measure async operation
   */
  async measure<T>(name: string, operation: () => Promise<T>): Promise<T> {
    const start = performance.now();
    try {
      const result = await operation();
      const duration = performance.now() - start;
      this.captureMetric(name, duration);
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      this.captureMetric(`${name}_failed`, duration);
      this.captureError(error as Error, { operation: name });
      throw error;
    }
  }

  /**
   * Get health status
   */
  getHealth(): {
    errorCount: number;
    lastErrorTime: number | null;
    avgErrorRate: number;
    recentMetrics: PerformanceMetric[];
  } {
    const now = Date.now();
    const oneHourAgo = now - 3600000;

    const recentErrors = this.errors.filter(e => e.timestamp > oneHourAgo);
    const recentMetrics = this.metrics.slice(-10);

    return {
      errorCount: this.errors.length,
      lastErrorTime: this.errors.length > 0 ? this.errors[this.errors.length - 1].timestamp : null,
      avgErrorRate: recentErrors.length / 24, // Errors per hour
      recentMetrics,
    };
  }

  /**
   * Export logs (for debugging)
   */
  exportLogs(): { errors: ErrorInfo[]; metrics: PerformanceMetric[] } {
    return {
      errors: [...this.errors],
      metrics: [...this.metrics],
    };
  }

  /**
   * Clear all logs
   */
  clear(): void {
    this.errors = [];
    this.metrics = [];
  }

  /**
   * Send to external monitoring service (placeholder)
   */
  private async sendToErrorService(errorInfo: ErrorInfo): Promise<void> {
    try {
      // Would integrate with Sentry, LogRocket, etc.
      // await fetch('https://your-monitoring-service.com/errors', {
      //   method: 'POST',
      //   body: JSON.stringify(errorInfo),
      // });

      if (import.meta.env.DEV) {
        console.log('[Monitoring] Would send error to external service:', errorInfo);
      }
    } catch (error) {
      console.warn('Failed to send to monitoring service:', error);
    }
  }

  /**
   * Create performance report
   */
  getPerformanceReport(): {
    averageDurations: Record<string, number>;
    slowestOperations: { name: string; duration: number }[];
    totalOperations: number;
  } {
    const sums: Record<string, number> = {};
    const counts: Record<string, number> = {};

    this.metrics.forEach(m => {
      sums[m.name] = (sums[m.name] || 0) + m.duration;
      counts[m.name] = (counts[m.name] || 0) + 1;
    });

    const averages: Record<string, number> = {};
    Object.keys(sums).forEach(name => {
      averages[name] = sums[name] / counts[name];
    });

    const sorted = [...this.metrics]
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 5)
      .map(m => ({ name: m.name, duration: m.duration }));

    return {
      averageDurations: averages,
      slowestOperations: sorted,
      totalOperations: this.metrics.length,
    };
  }
}

export const monitoringService = new MonitoringService();

/**
 * React Error Boundary Integration
 */
export class MonitoredErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    monitoringService.captureError(error, {
      componentStack: errorInfo.componentStack,
      boundary: true,
    });
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-4 bg-red-50 border border-red-200 rounded">
          <h2>Ein Fehler ist aufgetreten</h2>
          <button onClick={() => window.location.reload()}>Seite neu laden</button>
        </div>
      );
    }
    return this.props.children;
  }
}

/**
 * Hook for monitoring
 */
export function useMonitoring() {
  const logError = (error: Error | string, context?: any) => {
    monitoringService.captureError(error, context);
  };

  const measure = <T>(name: string, fn: () => Promise<T>) => {
    return monitoringService.measure(name, fn);
  };

  const getHealth = () => monitoringService.getHealth();

  return { logError, measure, getHealth };
}
