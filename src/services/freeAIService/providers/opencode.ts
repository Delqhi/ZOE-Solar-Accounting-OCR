/**
 * OpenCode ZEN Provider
 * 100% FREE unlimited
 * Best Practices February 2026 - TypeScript Strict Mode
 */

import type { Provider, ExtractedData } from '../types';
import { OCR_PROMPT } from '../config';
import { fetchWithTimeout, handleAPIError, buildOpenAIRequest } from './base';
import { parseOpenAICompatibleResponse } from '../parsers';

/**
 * Execute OCR using OpenCode ZEN API
 * Note: OpenCode doesn't support response_format, so we disable it
 */
export async function tryOpenCode(
  provider: Provider,
  base64: string,
  mimeType: string
): Promise<Partial<ExtractedData>> {
  const { config } = provider;

  const requestBody = buildOpenAIRequest(config.model, OCR_PROMPT, base64, mimeType, {
    responseFormat: false, // OpenCode doesn't support response_format
  });

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
    handleAPIError(response, 'OpenCode', errorBody);
  }

  const responseData = await response.json();
  return parseOpenAICompatibleResponse(responseData, 'OpenCode');
}
