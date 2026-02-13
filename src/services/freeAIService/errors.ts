import type { ErrorCode } from './types';

export class FreeAIServiceError extends Error {
  constructor(
    message: string,
    public readonly provider: string,
    public readonly code: ErrorCode,
    public readonly retryable: boolean = true
  ) {
    super(message);
    this.name = 'FreeAIServiceError';
  }
}

export class ProviderUnavailableError extends FreeAIServiceError {
  constructor(provider: string) {
    super(`Provider ${provider} ist nicht verfügbar`, provider, 'API_ERROR', true);
  }
}

export class RateLimitError extends FreeAIServiceError {
  constructor(provider: string) {
    super(`Rate Limit erreicht für ${provider}`, provider, 'RATE_LIMIT', true);
  }
}

export class TimeoutError extends FreeAIServiceError {
  constructor(provider: string) {
    super(`Timeout bei ${provider}`, provider, 'TIMEOUT', true);
  }
}

export class NoAPIKeyError extends FreeAIServiceError {
  constructor() {
    super(
      'Kein API-Key konfiguriert. Bitte setze mindestens einen der folgenden Keys in .env:\n' +
        '- VITE_NVIDIA_API_KEY (NVIDIA Kimi K2.5 - Primary)\n' +
        '- VITE_SILICONFLOW_API_KEY (SiliconFlow - 1M tokens/day FREE)\n' +
        '- VITE_MISTRAL_API_KEY (Mistral - 1B tokens/month FREE)\n' +
        '- VITE_OPENCODE_API_KEY (OpenCode - 100% FREE)',
      'NONE',
      'NO_CREDITS',
      false
    );
  }
}

export class AllProvidersFailedError extends FreeAIServiceError {
  constructor(lastError?: Error) {
    super(
      `Alle Free OCR Provider fehlgeschlagen${lastError ? `: ${lastError.message}` : ''}`,
      'ALL',
      'API_ERROR',
      false
    );
  }
}
