/**
 * SiliconFlow Qwen 2.5 VL Provider
 * FREE Tier: 1M tokens/day
 * Best Practices February 2026 - TypeScript Strict Mode
 */

import type { Provider, ExtractedData } from '../types';
import { OCR_PROMPT } from '../config';
import { FreeAIServiceError } from '../errors';
import { fetchWithTimeout, handleAPIError, buildOpenAIRequest } from './base';
import { parseSiliconFlowResponse } from '../parsers';

/**
 * Execute OCR using SiliconFlow API (Qwen 2.5 VL 72B)
 */
export async function trySiliconFlow(
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
    handleAPIError(response, 'SiliconFlow', errorBody);
  }

  const responseData = await response.json();
  return parseSiliconFlowResponse(responseData);
}
