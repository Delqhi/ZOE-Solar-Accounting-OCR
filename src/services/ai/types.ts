export class FreeAIServiceError extends Error {
  constructor(
    message: string,
    public readonly provider: string,
    public readonly code: 'TIMEOUT' | 'RATE_LIMIT' | 'API_ERROR' | 'NO_CREDITS' | 'NETWORK_ERROR',
    public readonly retryable: boolean = true
  ) {
    super(message);
    this.name = 'FreeAIServiceError';
  }
}

export interface AIConfig {
  enabled: boolean;
  baseUrl: string;
  model: string;
  apiKey: string;
  priority: number;
  timeout: number;
  maxRetries: number;
}

export interface Provider {
  name: string;
  config: AIConfig;
}
