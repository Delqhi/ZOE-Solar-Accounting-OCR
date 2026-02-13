/**
 * Provider Exports
 * Best Practices February 2026 - TypeScript Strict Mode
 */

export {
  getAvailableProviders,
  fetchWithTimeout,
  handleAPIError,
  buildOpenAIRequest,
} from './base';
export { tryNVIDIA } from './nvidia';
export { trySiliconFlow } from './siliconflow';
export { tryMistral } from './mistral';
export { tryOpenCode } from './opencode';

import type { Provider, ExtractedData } from '../types';
import { FreeAIServiceError } from '../errors';
import { tryNVIDIA } from './nvidia';
import { trySiliconFlow } from './siliconflow';
import { tryMistral } from './mistral';
import { tryOpenCode } from './opencode';

/**
 * Try a provider based on its name
 */
export async function tryProvider(
  provider: Provider,
  base64: string,
  mimeType: string
): Promise<Partial<ExtractedData>> {
  switch (provider.name) {
    case 'NVIDIA':
      return tryNVIDIA(provider, base64, mimeType);
    case 'SILICONFLOW':
      return trySiliconFlow(provider, base64, mimeType);
    case 'MISTRAL':
      return tryMistral(provider, base64, mimeType);
    case 'OPENCODE':
      return tryOpenCode(provider, base64, mimeType);
    default:
      throw new FreeAIServiceError(
        `Unbekannter Provider: ${provider.name}`,
        provider.name,
        'API_ERROR',
        false
      );
  }
}
