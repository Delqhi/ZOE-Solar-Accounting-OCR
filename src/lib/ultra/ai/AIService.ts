/**
 * ULTRA 2026 - AI Service Base Class
 * Multi-provider AI service with circuit breaker pattern
 */

import type { Result, AIAnalysis } from '../types/results';

export type UserId = string;

export interface AIProvider {
  name: string;
  analyze(imageData: string, mimeType: string): Promise<AIAnalysis>;
}

export class AIService {
  protected providers: AIProvider[] = [];
  protected currentProviderIndex = 0;

  constructor() {
    // Initialize with empty provider list
    // Subclasses should add providers in constructor
  }

  async analyzeDocument(imageData: string, _userId: UserId): Promise<Result<AIAnalysis, string>> {
    if (this.providers.length === 0) {
      return {
        success: false,
        error: 'No AI providers configured',
      };
    }

    // Try each provider in order
    for (let i = this.currentProviderIndex; i < this.providers.length; i++) {
      const provider = this.providers[i];
      try {
        const analysis = await provider.analyze(imageData, 'image/jpeg');
        this.currentProviderIndex = i; // Remember working provider
        return {
          success: true,
          data: analysis,
        };
      } catch (error) {
        console.warn(`Provider ${provider.name} failed:`, error);
        continue;
      }
    }

    return {
      success: false,
      error: 'All AI providers failed',
    };
  }
}

export class AICircuitBreaker {
  private failures = 0;
  private lastFailureTime: number | null = null;
  private readonly threshold = 5;
  private readonly timeout = 60000; // 1 minute

  recordSuccess(): void {
    this.failures = 0;
    this.lastFailureTime = null;
  }

  recordFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();
  }

  isOpen(): boolean {
    if (this.failures < this.threshold) {
      return false;
    }
    if (this.lastFailureTime === null) {
      return false;
    }
    // Check if timeout has passed
    return Date.now() - this.lastFailureTime < this.timeout;
  }

  reset(): void {
    this.failures = 0;
    this.lastFailureTime = null;
  }
}
