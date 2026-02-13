/**
 * Mistral Pixtral Provider
 * FREE Tier: 1B tokens/month
 * Best Practices February 2026 - TypeScript Strict Mode
 */

import type { Provider, ExtractedData } from '../types';
import { OCR_PROMPT } from '../config';
import { fetchWithTimeout, handleAPIError, buildOpenAIRequest } from './base';
import { parseOpenAICompatibleResponse } from '../parsers';

/**
 * Execute OCR using Mistral API (Pixtral 12B)
 */
export async function tryMistral(
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
    handleAPIError(response, 'Mistral', errorBody);
  }

  const responseData = await response.json();
  return parseOpenAICompatibleResponse(responseData, 'Mistral');
}
