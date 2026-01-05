/**
 * Gemini OCR Service
 * Production-ready OCR processing with rate limiting, validation, and error handling
 * Implements 2026 best practices for AI service integration
 */

import { GoogleGenAI, Type, Schema } from "@google/genai";
import { ExtractedData, OcrProvider } from "../types";
import { analyzeDocumentWithFallback } from "./fallbackService";
import { normalizeExtractedData } from "./extractedDataNormalization";
import { ocrRateLimiter } from "../utils/rateLimiter";
import { validateBase64Data, validateMimeType } from "../utils/validation";
import { PerformanceMonitor } from "../utils/performanceMonitor";

// Type-safe configuration interface
interface GeminiConfig {
  apiKey: string;
  model: string;
  maxRetries: number;
  retryDelayMs: number;
  timeoutMs: number;
}

// Service configuration with 2026 best practices
const CONFIG: GeminiConfig = {
  apiKey: import.meta.env.VITE_GEMINI_API_KEY || "",
  model: "gemini-2.5-flash",
  maxRetries: 2,
  retryDelayMs: 1500,
  timeoutMs: 30000, // 30 second timeout
};

// Validate environment on initialization
if (!CONFIG.apiKey || CONFIG.apiKey === "PLACEHOLDER_GET_FROM_VERCEL") {
  console.warn("⚠️  Gemini API key not configured. OCR operations will fail.");
}

// Initialize AI client
const ai = new GoogleGenAI({ apiKey: CONFIG.apiKey });

/**
 * Accounting schema for structured data extraction
 * Uses strict typing to ensure data integrity
 */
const accountingSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    belegDatum: { type: Type.STRING, description: "YYYY-MM-DD format" },
    belegNummerLieferant: { type: Type.STRING },
    lieferantName: { type: Type.STRING },
    lieferantAdresse: { type: Type.STRING },
    steuernummer: { type: Type.STRING },
    nettoBetrag: { type: Type.NUMBER },
    mwstSatz0: { type: Type.NUMBER },
    mwstBetrag0: { type: Type.NUMBER },
    mwstSatz7: { type: Type.NUMBER },
    mwstBetrag7: { type: Type.NUMBER },
    mwstSatz19: { type: Type.NUMBER },
    mwstBetrag19: { type: Type.NUMBER },
    bruttoBetrag: { type: Type.NUMBER, description: "The final total amount (Zahlbetrag)" },
    zahlungsmethode: { type: Type.STRING },
    lineItems: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          description: { type: Type.STRING },
          amount: { type: Type.NUMBER }
        },
        required: ["description", "amount"]
      }
    },
    textContent: { type: Type.STRING, description: "Summary of visible text for categorization keywords" },
    beschreibung: { type: Type.STRING },
    kontogruppe: { type: Type.STRING, description: "Calculated by rule engine later" }
  },
  required: ["belegDatum", "lieferantName", "bruttoBetrag"]
};

/**
 * System instruction for the AI model
 * Optimized for German accounting documents with math verification
 */
const SYSTEM_INSTRUCTION = `
You are an elite German Accounting Data Extraction AI.
Your goal is 100% ACCURACY for "Bruttobetrag" (Total Amount).

CRITICAL EXTRACTION PROTOCOL:
1. **Find the Total**: Look for keywords: "Zahlbetrag", "Gesamtbetrag", "Rechnungsbetrag", "Summe". It is usually the last number at the bottom right, often bold.
2. **Math Check**: Identify Netto and VAT (MwSt). Verify: Netto + MwSt = Brutto.
   - If they match exactly, confidence is high.
   - If they do NOT match, trust the explicitly printed "Zahlbetrag" over the sum of line items.
   - Watch out for "Pfand" or "Rabatt" which might affect the total.
3. **Common Pitfalls**:
   - Do NOT confuse the "Unterschrift" date with the "Belegdatum".
   - Do NOT confuse the "Kunden-Nr" with the "Rechnungs-Nr".
   - 5 vs 6 vs 8: Look closely at the pixel structure.
   - 1 vs 7: Look for the crossbar.

DATA STANDARDS:
- Dates: YYYY-MM-DD only.
- Numbers: Float format (12.99). Use dots, no commas.
- Tax: Distinguish 0%, 7%, 19%. Put 0% or "Steuerfrei" in mwstSatz0.
- Language: Summaries in German.
`;

/**
 * Error classification for better error handling
 */
class GeminiServiceError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly isRetryable: boolean = false,
    public readonly originalError?: any
  ) {
    super(message);
    this.name = "GeminiServiceError";
  }
}

/**
 * Rate limit check result
 */
interface RateLimitCheck {
  allowed: boolean;
  retryAfter?: number;
  remaining?: number;
}

/**
 * Utility: Delay execution
 */
const delay = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Validates and sanitizes base64 data
 * @throws GeminiServiceError if validation fails
 */
function validateInputData(base64Data: string, mimeType: string): void {
  const base64Validation = validateBase64Data(base64Data);
  if (!base64Validation.valid) {
    throw new GeminiServiceError(
      `Invalid base64 data: ${base64Validation.errors?.join(", ")}`,
      "INVALID_INPUT",
      false
    );
  }

  const mimeTypeValidation = validateMimeType(mimeType);
  if (!mimeTypeValidation.valid) {
    throw new GeminiServiceError(
      `Invalid MIME type: ${mimeTypeValidation.errors?.join(", ")}`,
      "INVALID_INPUT",
      false
    );
  }

  // Additional size check (50MB limit)
  const sizeInBytes = Math.ceil((base64Data.length * 3) / 4);
  const maxSize = 50 * 1024 * 1024; // 50MB
  if (sizeInBytes > maxSize) {
    throw new GeminiServiceError(
      `File too large: ${(sizeInBytes / 1024 / 1024).toFixed(2)}MB exceeds ${maxSize / 1024 / 1024}MB limit`,
      "FILE_TOO_LARGE",
      false
    );
  }
}

/**
 * Checks rate limit before processing
 * @throws GeminiServiceError if rate limit exceeded
 */
async function checkRateLimit(userId: string): Promise<void> {
  try {
    const result = await ocrRateLimiter.check(userId);
    if (!result.allowed) {
      throw new GeminiServiceError(
        `Rate limit exceeded. Retry after ${result.retryAfter || 60} seconds.`,
        "RATE_LIMIT_EXCEEDED",
        false
      );
    }
  } catch (error) {
    if (error instanceof GeminiServiceError) throw error;
    throw new GeminiServiceError(
      `Rate limit check failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      "RATE_LIMIT_CHECK_FAILED",
      true
    );
  }
}

/**
 * Core API call with timeout and retry logic
 */
async function callGeminiAPI(
  model: string,
  contents: any,
  config: any,
  retryCount: number = 0
): Promise<any> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error("Request timeout")), CONFIG.timeoutMs);
  });

  const apiPromise = ai.models.generateContent({ model, contents, config });

  try {
    return await Promise.race([apiPromise, timeoutPromise]);
  } catch (error: any) {
    // Check if error is retryable
    const isRetryable =
      error.status === 429 ||
      error.status === 503 ||
      error.status === 502 ||
      error.message?.includes("429") ||
      error.message?.includes("503") ||
      error.message?.includes("Quota") ||
      error.message?.includes("timeout");

    if (isRetryable && retryCount < CONFIG.maxRetries) {
      console.warn(`⚠️  Gemini API error (attempt ${retryCount + 1}/${CONFIG.maxRetries}): ${error.message}`);
      console.log(`⏳ Retrying in ${CONFIG.retryDelayMs}ms...`);

      await delay(CONFIG.retryDelayMs);
      return callGeminiAPI(model, contents, config, retryCount + 1);
    }

    throw new GeminiServiceError(
      `Gemini API call failed: ${error.message || "Unknown error"}`,
      isRetryable ? "API_RETRY_EXHAUSTED" : "API_ERROR",
      false,
      error
    );
  }
}

/**
 * Parses and validates JSON response from AI
 */
function parseAIResponse(responseText: string): any {
  if (!responseText) {
    throw new GeminiServiceError("Empty response from AI", "EMPTY_RESPONSE", false);
  }

  // Handle markdown code blocks
  let jsonString = responseText.trim();
  if (jsonString.startsWith('```json')) {
    jsonString = jsonString.replace(/^```json/, '').replace(/```$/, '').trim();
  } else if (jsonString.startsWith('```')) {
    jsonString = jsonString.replace(/^```/, '').replace(/```$/, '').trim();
  }

  // Parse JSON
  let parsed: any;
  try {
    parsed = JSON.parse(jsonString);
  } catch (parseError: any) {
    throw new GeminiServiceError(
      `JSON parse error: ${parseError.message}. Raw response: ${jsonString.substring(0, 200)}...`,
      "JSON_PARSE_ERROR",
      false
    );
  }

  // Validate required fields
  if (!parsed || typeof parsed !== "object") {
    throw new GeminiServiceError("Invalid response format: expected JSON object", "INVALID_FORMAT", false);
  }

  return parsed;
}

/**
 * Main OCR processing function with comprehensive error handling
 */
export const analyzeDocumentWithGemini = async (
  base64Data: string,
  mimeType: string,
  userId: string = "anonymous"
): Promise<Partial<ExtractedData>> => {
  const startTime = PerformanceMonitor.now();
  const operationId = `gemini-ocr-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  try {
    console.log(`🔍 [${operationId}] Starting Gemini OCR analysis...`);

    // Step 1: Validate inputs
    console.log(`📋 [${operationId}] Validating input data...`);
    validateInputData(base64Data, mimeType);

    // Step 2: Check rate limit
    console.log(`⏱️  [${operationId}] Checking rate limit...`);
    await checkRateLimit(userId);

    // Step 3: Call Gemini API with timeout and retry
    console.log(`🤖 [${operationId}] Calling Gemini API...`);
    const response = await callGeminiAPI(
      CONFIG.model,
      {
        parts: [
          { inlineData: { mimeType: mimeType, data: base64Data } },
          { text: "Extract accounting data accurately. Double check the Total Amount." }
        ]
      },
      {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: accountingSchema,
        temperature: 0,
      }
    );

    // Step 4: Parse response
    console.log(`📦 [${operationId}] Parsing AI response...`);
    const parsed = parseAIResponse(response.text);

    // Step 5: Normalize data
    console.log(`✅ [${operationId}] Normalizing extracted data...`);
    const normalized = normalizeExtractedData(parsed);

    // Step 6: Add metadata
    normalized.ocr_provider = "gemini";
    normalized.ocr_confidence = "high";
    normalized.ocr_rationale = `Gemini 2.5 Flash extraction successful. Operation ID: ${operationId}`;

    const duration = PerformanceMonitor.now() - startTime;
    console.log(`✅ [${operationId}] OCR completed successfully in ${duration.toFixed(2)}ms`);

    return normalized;

  } catch (error: any) {
    const duration = PerformanceMonitor.now() - startTime;
    console.error(`❌ [${operationId}] OCR failed after ${duration.toFixed(2)}ms`, error);

    // Log to performance monitor
    PerformanceMonitor.recordMetric("gemini_ocr_failure", {
      operationId,
      duration,
      error: error.message,
      errorCode: error.code || "UNKNOWN"
    });

    // Handle specific error types
    if (error instanceof GeminiServiceError) {
      if (error.code === "RATE_LIMIT_EXCEEDED") {
        // Don't fallback on rate limit - let the user know
        throw error;
      }
      if (error.code === "INVALID_INPUT") {
        // Don't fallback on invalid input
        throw error;
      }
    }

    // All other errors trigger fallback
    console.log(`🔄 [${operationId}] Falling back to alternative OCR service...`);

    try {
      const fallback = await analyzeDocumentWithFallback(base64Data, mimeType);
      const normalized = normalizeExtractedData(fallback);

      // Add fallback metadata
      const geminiError = error instanceof Error ? error.message : "Unknown error";
      const existing = normalized.ocr_rationale ? normalized.ocr_rationale.trim() : '';
      const prefix = `Gemini fehlgeschlagen: ${geminiError}`;
      normalized.ocr_rationale = existing ? `${prefix} | ${existing}` : prefix;
      normalized.ocr_provider = "fallback";
      normalized.ocr_confidence = "medium";

      console.log(`✅ [${operationId}] Fallback successful`);
      return normalized;

    } catch (fallbackError: any) {
      console.error(`❌ [${operationId}] Fallback also failed`, fallbackError);

      // Return minimal valid data structure with error info
      return {
        ocr_provider: "failed",
        ocr_confidence: "none",
        ocr_rationale: `Alle OCR-Ansätze fehlgeschlagen. Gemini: ${error instanceof Error ? error.message : "Unknown"}, Fallback: ${fallbackError instanceof Error ? fallbackError.message : "Unknown"}`,
        error: fallbackError instanceof Error ? fallbackError.message : "Unknown error"
      } as Partial<ExtractedData>;
    }
  }
};

/**
 * Health check function for service monitoring
 */
export async function checkGeminiServiceHealth(): Promise<{
  healthy: boolean;
  message: string;
  details?: any;
}> {
  try {
    // Check if API key is configured
    if (!CONFIG.apiKey || CONFIG.apiKey === "PLACEHOLDER_GET_FROM_VERCEL") {
      return {
        healthy: false,
        message: "API key not configured"
      };
    }

    // Check rate limiter
    const rateCheck = await ocrRateLimiter.check("health-check");
    if (!rateCheck.allowed) {
      return {
        healthy: false,
        message: "Rate limit exceeded",
        details: { retryAfter: rateCheck.retryAfter }
      };
    }

    return {
      healthy: true,
      message: "Service operational"
    };

  } catch (error) {
    return {
      healthy: false,
      message: `Health check failed: ${error instanceof Error ? error.message : "Unknown error"}`
    };
  }
}

/**
 * OCR Provider implementation
 */
export const geminiProvider: OcrProvider = {
  analyzeDocument: analyzeDocumentWithGemini,
  healthCheck: checkGeminiServiceHealth
};

/**
 * Export for testing and debugging
 */
export const geminiService = {
  analyzeDocumentWithGemini,
  checkGeminiServiceHealth,
  validateInputData,
  checkRateLimit,
  parseAIResponse,
  CONFIG
};
