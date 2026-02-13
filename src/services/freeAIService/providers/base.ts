/**
 * Base provider utilities for Free AI Service
 * Best Practices February 2026 - TypeScript Strict Mode
 */

import type { Provider, ProviderConfig } from '../types';
import { PROVIDER_CONFIGS } from '../config';
import { FreeAIServiceError } from '../errors';

/**
 * Get all available providers sorted by priority
 */
export function getAvailableProviders(): Provider[] {
  const providers: Provider[] = [];

  for (const [name, config] of Object.entries(PROVIDER_CONFIGS)) {
    if (config.enabled && config.apiKey) {
      providers.push({ name, config });
    }
  }

  return providers.sort((a, b) => a.config.priority - b.config.priority);
}

/**
 * Create a request with timeout and abort signal
 */
export async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeout: number
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Handle API error responses
 */
export function handleAPIError(
  response: Response,
  providerName: string,
  responseBody?: string
): never {
  const isRateLimit = response.status === 429;
  const isUnauthorized = response.status === 401;

  throw new FreeAIServiceError(
    `${providerName} API Error: ${response.status} - ${responseBody || 'Unknown error'}`,
    providerName,
    isRateLimit ? 'RATE_LIMIT' : 'API_ERROR',
    !isUnauthorized
  );
}

/**
 * Build OpenAI-compatible request body
 */
export function buildOpenAIRequest(
  model: string,
  prompt: string,
  base64: string,
  mimeType: string,
  options?: { responseFormat?: boolean }
): Record<string, unknown> {
  return {
    model,
    messages: [
      { role: 'system', content: prompt },
      {
        role: 'user',
        content: [
          { type: 'text', text: 'Extrahiere alle Daten aus diesem Dokument:' },
          {
            type: 'image_url',
            image_url: { url: `data:${mimeType};base64,${base64}` },
          },
        ],
      },
    ],
    temperature: 0.1,
    max_tokens: 4096,
    ...(options?.responseFormat !== false && { response_format: { type: 'json_object' } }),
  };
}
