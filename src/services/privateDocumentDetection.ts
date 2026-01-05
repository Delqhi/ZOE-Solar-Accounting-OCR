/** Private Document Detection - Placeholder */

import { ExtractedData } from '../types';

interface PrivateCheckResult {
  isPrivate: boolean;
  detectedVendor?: string;
  reason?: string;
}

export function detectPrivateDocument(_data: Partial<ExtractedData>): PrivateCheckResult {
  // Placeholder logic - normally this would detect private expenses
  return {
    isPrivate: false
  };
}
