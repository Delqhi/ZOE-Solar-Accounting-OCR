/**
 * NVIDIA Kimi K2.5 Provider
 * Primary provider for OCR - Best quality
 * Best Practices February 2026 - TypeScript Strict Mode
 */

import type { Provider, ExtractedData } from '../types';
import { OCR_PROMPT } from '../config';
import { FreeAIServiceError } from '../errors';
import { fetchWithTimeout, handleAPIError, buildOpenAIRequest } from './base';
import { parseOpenAICompatibleResponse } from '../parsers';

/**
 * Execute OCR using NVIDIA API (Kimi K2.5)
 */
export async function tryNVIDIA(
  provider: Provider,
  base64: string,
  mimeType: string
): Promise<Partial<ExtractedData>> {
  const { config } = provider;

  const requestBody = buildOpenAIRequest(config.model, OCR_PROMPT, base64, mimeType);

  const response = await fetchWithTimeout(
    `${config.baseUrl}/chat/completions`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    },
    config.timeout
  );

  if (!response.ok) {
    const errorBody = await response.text();
    handleAPIError(response, 'NVIDIA', errorBody);
  }

  const responseData = await response.json();
  return parseOpenAICompatibleResponse(responseData, 'NVIDIA');
}
