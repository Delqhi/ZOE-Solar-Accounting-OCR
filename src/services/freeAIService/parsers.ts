import type { ExtractedData } from '../../types';
import type { APIResponse, OllamaResponse, RawOCRResult } from './types';
import { FreeAIServiceError } from './errors';
import { DEFAULT_OCR_SCORE } from './config';

export function parseSiliconFlowResponse(data: unknown): Partial<ExtractedData> {
  const response = data as APIResponse;
  const content = response.choices?.[0]?.message?.content;

  if (!content) {
    throw new FreeAIServiceError('Leere Antwort von SiliconFlow', 'SiliconFlow', 'API_ERROR', true);
  }

  return parseJSONContent(content);
}

export function parseOpenAICompatibleResponse(
  data: unknown,
  providerName: string
): Partial<ExtractedData> {
  const response = data as APIResponse;
  const content = response.choices?.[0]?.message?.content;

  if (!content) {
    throw new FreeAIServiceError(
      `Leere Antwort von ${providerName}`,
      providerName,
      'API_ERROR',
      true
    );
  }

  return parseJSONContent(content);
}

export function parseOllamaResponse(data: unknown): Partial<ExtractedData> {
  const response = data as OllamaResponse;
  const content = response.response;

  if (!content) {
    throw new FreeAIServiceError('Leere Antwort von Ollama', 'Ollama', 'API_ERROR', false);
  }

  return parseJSONContent(content);
}

export function parseJSONContent(content: string): Partial<ExtractedData> {
  try {
    const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) ||
      content.match(/```\n?([\s\S]*?)\n?```/) || [null, content];

    const jsonString = jsonMatch[1] || content;
    const parsed = JSON.parse(jsonString.trim()) as RawOCRResult;

    return {
      documentType: parsed.documentType || 'RECHNUNG',
      lieferantName: parsed.lieferantName || '',
      lieferantAdresse: parsed.lieferantAdresse || '',
      steuernummer: parsed.steuernummer || '',
      belegNummerLieferant: parsed.belegNummerLieferant || '',
      belegDatum: parsed.belegDatum || new Date().toISOString().split('T')[0],
      nettoBetrag: Number(parsed.nettoBetrag) || 0,
      bruttoBetrag: Number(parsed.bruttoBetrag) || 0,
      mwstSatz19: Number(parsed.mwstSatz19) || 19,
      mwstBetrag19: Number(parsed.mwstBetrag19) || 0,
      mwstSatz7: Number(parsed.mwstSatz7) || 7,
      mwstBetrag7: Number(parsed.mwstBetrag7) || 0,
      mwstSatz0: Number(parsed.mwstSatz0) || 0,
      mwstBetrag0: Number(parsed.mwstBetrag0) || 0,
      zahlungsmethode: parsed.zahlungsmethode || 'Überweisung',
      zahlungsDatum: parsed.zahlungsDatum || '',
      beschreibung: parsed.beschreibung || '',
      lineItems: Array.isArray(parsed.lineItems)
        ? parsed.lineItems.map((item) => ({
            description: item.description || '',
            amount: Number(item.amount) || 0,
            quantity: Number(item.quantity) || 1,
          }))
        : [],
      ocr_rationale: parsed.ocr_rationale || 'Automatische Extraktion',
      ocr_score: DEFAULT_OCR_SCORE,
    };
  } catch (error) {
    throw new FreeAIServiceError(
      `JSON Parsing Fehler: ${error instanceof Error ? error.message : 'Unknown'}`,
      'PARSER',
      'API_ERROR',
      true
    );
  }
}
