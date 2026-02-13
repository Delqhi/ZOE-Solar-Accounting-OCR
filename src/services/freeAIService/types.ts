import type { ExtractedData, LineItem } from '../../types';

export type { ExtractedData, LineItem };

export type ErrorCode = 'TIMEOUT' | 'RATE_LIMIT' | 'API_ERROR' | 'NO_CREDITS' | 'NETWORK_ERROR';

export interface ProviderConfig {
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
  config: ProviderConfig;
}

export interface APIResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
}

export interface OllamaResponse {
  response?: string;
}

export interface ParsedLineItem {
  description: string;
  amount: number;
  quantity: number;
}

export interface RawOCRResult {
  documentType?: string;
  lieferantName?: string;
  lieferantAdresse?: string;
  steuernummer?: string;
  belegNummerLieferant?: string;
  belegDatum?: string;
  nettoBetrag?: number | string;
  bruttoBetrag?: number | string;
  mwstSatz19?: number | string;
  mwstBetrag19?: number | string;
  mwstSatz7?: number | string;
  mwstBetrag7?: number | string;
  mwstSatz0?: number | string;
  mwstBetrag0?: number | string;
  zahlungsmethode?: string;
  zahlungsDatum?: string;
  beschreibung?: string;
  lineItems?: Array<{
    description?: string;
    amount?: number | string;
    quantity?: number | string;
  }>;
  ocr_rationale?: string;
}

export interface ProviderStatus {
  name: string;
  configured: boolean;
  freeTier: string;
}

export interface TestResult {
  name: string;
  status: 'ok' | 'error';
  message: string;
}
