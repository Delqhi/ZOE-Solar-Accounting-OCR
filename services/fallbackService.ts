
/**
 * Fallback OCR Service
 * SiliconFlow Vision API integration with rate limiting and error handling
 * Implements 2026 best practices for fallback OCR processing
 */

import { ExtractedData, OcrProvider } from "../types";
import * as pdfjsLib from 'pdfjs-dist';
import { normalizeExtractedData } from "./extractedDataNormalization";
import { ocrRateLimiter } from "../utils/rateLimiter";
import { validateBase64Data, validateMimeType } from "../utils/validation";
import { PerformanceMonitor } from "../utils/performanceMonitor";

// Type-safe configuration interface
interface SiliconFlowConfig {
  apiKey: string;
  apiUrl: string;
  model: string;
  maxPdfPages: number;
  maxPdfBytes: number;
  timeoutMs: number;
  maxRetries: number;
  retryDelayMs: number;
}

// Service configuration
const CONFIG: SiliconFlowConfig = {
  apiKey: import.meta.env.VITE_SILICONFLOW_API_KEY || "",
  apiUrl: "https://api.siliconflow.com/v1/chat/completions",
  model: "Qwen/Qwen2.5-VL-72B-Instruct",
  maxPdfPages: 3,
  maxPdfBytes: 12 * 1024 * 1024, // ~12MB decoded
  timeoutMs: 30000, // 30 seconds
  maxRetries: 2,
  retryDelayMs: 1500,
};

// Validate environment on initialization
if (!CONFIG.apiKey || CONFIG.apiKey === "PLACEHOLDER_GET_FROM_VERCEL") {
  console.warn("⚠️  SiliconFlow API key not configured. Fallback OCR will fail.");
}

// Helper to robustly resolve PDF.js library instance from ESM import
const getPdfJs = () => {
    const lib = pdfjsLib as any;
    if (lib.default && lib.default.getDocument) return lib.default;
    if (lib.getDocument) return lib;
    return lib.default || lib;
};

const pdf = getPdfJs();

// Safely set worker source
if (pdf && pdf.GlobalWorkerOptions) {
    try {
        pdf.GlobalWorkerOptions.workerSrc = "https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js";
    } catch (e) {
        console.warn("Failed to set PDF worker source:", e);
    }
}

/**
 * System prompt for vision model
 */
const SYSTEM_PROMPT_VISION = `
You are a professional Accounting AI OCR.
Your task is to extract invoice data from the provided image with 100% precision.

CRITICAL:
- Look for "Gesamtbetrag", "Rechnungsbetrag", "Zahlbetrag".
- Verify mathematically: Net + Tax = Gross.
- If multiple pages are stitched together, analyze ALL of them.

Output strictly valid JSON:
{
  "belegDatum": "YYYY-MM-DD",
  "belegNummerLieferant": "string",
  "lieferantName": "string",
  "lieferantAdresse": "string",
  "steuernummer": "string",
  "nettoBetrag": number,
  "mwstSatz0": number,
  "mwstBetrag0": number,
  "mwstSatz7": number,
  "mwstBetrag7": number,
  "mwstSatz19": number,
  "mwstBetrag19": number,
  "bruttoBetrag": number,
  "zahlungsmethode": "string",
  "lineItems": [ { "description": "string", "amount": number } ],
  "textContent": "string (brief keywords summary)",
  "beschreibung": "string (German summary)"
}
`;

/**
 * Error classification for better error handling
 */
class FallbackServiceError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly isRetryable: boolean = false,
    public readonly originalError?: any
  ) {
    super(message);
    this.name = "FallbackServiceError";
  }
}

/**
 * Utility: Delay execution
 */
const delay = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Utility: Summarize text
 */
const summarize = (s: string, maxLen = 280): string => {
    const clean = (s || '').replace(/\s+/g, ' ').trim();
    return clean.length > maxLen ? clean.slice(0, maxLen) + '…' : clean;
};

/**
 * Converts user-friendly error messages
 */
const toUserFriendlyFallbackReason = (error: unknown): string => {
    const raw = error instanceof Error ? error.message : String(error);
    const msg = summarize(raw);

    if (!msg) return 'Fallback fehlgeschlagen. Bitte manuell erfassen.';

    if (msg.toLowerCase().includes('api key') || msg.includes('SILICONFLOW_API_KEY')) {
        return 'SiliconFlow nicht konfiguriert: SILICONFLOW_API_KEY in .env setzen und neu laden.';
    }

    if (msg.includes('PDF ist zu groß')) {
        return msg;
    }

    if (msg.toLowerCase().includes('pdf.js') || msg.toLowerCase().includes('pdf')) {
        return msg.includes('Bitte') ? msg : 'PDF konnte nicht für OCR verarbeitet werden. Bitte PDF verkleinern oder in einzelne Seiten splitten.';
    }

    if (msg.startsWith('Vision API Error')) {
        return `SiliconFlow Vision API Fehler: ${msg}`;
    }

    if (msg.toLowerCase().includes('empty response')) {
        return 'SiliconFlow lieferte keine verwertbare Antwort.';
    }

    return `Fallback fehlgeschlagen: ${msg}`;
};

/**
 * Validates input data before processing
 * @throws FallbackServiceError if validation fails
 */
function validateInputData(base64Data: string, mimeType: string): void {
  const base64Validation = validateBase64Data(base64Data);
  if (!base64Validation.valid) {
    throw new FallbackServiceError(
      `Invalid base64 data: ${base64Validation.errors?.join(", ")}`,
      "INVALID_INPUT",
      false
    );
  }

  const mimeTypeValidation = validateMimeType(mimeType);
  if (!mimeTypeValidation.valid) {
    throw new FallbackServiceError(
      `Invalid MIME type: ${mimeTypeValidation.errors?.join(", ")}`,
      "INVALID_INPUT",
      false
    );
  }

  // Additional size check
  const sizeInBytes = Math.ceil((base64Data.length * 3) / 4);
  const maxSize = 50 * 1024 * 1024; // 50MB
  if (sizeInBytes > maxSize) {
    throw new FallbackServiceError(
      `File too large: ${(sizeInBytes / 1024 / 1024).toFixed(2)}MB exceeds ${maxSize / 1024 / 1024}MB limit`,
      "FILE_TOO_LARGE",
      false
    );
  }
}

/**
 * Checks rate limit before processing
 * @throws FallbackServiceError if rate limit exceeded
 */
async function checkRateLimit(userId: string): Promise<void> {
  try {
    const result = await ocrRateLimiter.check(userId);
    if (!result.allowed) {
      throw new FallbackServiceError(
        `Rate limit exceeded. Retry after ${result.retryAfter || 60} seconds.`,
        "RATE_LIMIT_EXCEEDED",
        false
      );
    }
  } catch (error) {
    if (error instanceof FallbackServiceError) throw error;
    throw new FallbackServiceError(
      `Rate limit check failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      "RATE_LIMIT_CHECK_FAILED",
      true
    );
  }
}

/**
 * Helper: Process image for AI
 * Scales down very large images to avoid API token limits while keeping legibility.
 */
async function processImageForAI(base64Data: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = (err) => reject(new FallbackServiceError("Failed to load image", "IMAGE_LOAD_ERROR", false, err));
        img.src = base64Data.startsWith('data:') ? base64Data : `data:image/jpeg;base64,${base64Data}`;
    });
}

/**
 * Helper: Convert PDF Pages to a Single Stitched Image (Vertical)
 * This allows the Vision AI to see the WHOLE document at once.
 */
async function convertPdfToStitchedImage(base64Pdf: string): Promise<string> {
    try {
        if (!pdf || !pdf.getDocument) {
            throw new FallbackServiceError("PDF.js library not correctly initialized", "PDFJS_INIT_ERROR", false);
        }

        // Fast size check (base64 length -> bytes approx)
        const approxBytes = Math.floor((base64Pdf.length * 3) / 4);
        if (approxBytes > CONFIG.maxPdfBytes) {
            throw new FallbackServiceError(
                `PDF ist zu groß für OCR-Stitching (>${Math.round(CONFIG.maxPdfBytes / (1024 * 1024))}MB). Bitte PDF verkleinern oder Seiten splitten.`,
                "PDF_TOO_LARGE",
                false
            );
        }

        const binaryString = atob(base64Pdf);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }

        const loadingTask = pdf.getDocument({ data: bytes });
        const pdfDoc = await loadingTask.promise;
        const numPages = Math.min(pdfDoc.numPages, CONFIG.maxPdfPages);

        const pageImages: { img: ImageBitmap, width: number, height: number }[] = [];
        let totalHeight = 0;
        let maxWidth = 0;

        for (let pageNum = 1; pageNum <= numPages; pageNum++) {
            const page = await pdfDoc.getPage(pageNum);
            const viewport = page.getViewport({ scale: 2.0 });

            const canvas = document.createElement('canvas');
            canvas.width = viewport.width;
            canvas.height = viewport.height;

            const context = canvas.getContext('2d');
            if (!context) continue;

            await page.render({ canvasContext: context, viewport }).promise;

            const bitmap = await createImageBitmap(canvas);
            pageImages.push({ img: bitmap, width: viewport.width, height: viewport.height });

            totalHeight += viewport.height;
            maxWidth = Math.max(maxWidth, viewport.width);
        }

        // Stitch into one canvas
        const stitchedCanvas = document.createElement('canvas');
        stitchedCanvas.width = maxWidth;
        stitchedCanvas.height = totalHeight;
        const ctx = stitchedCanvas.getContext('2d');

        if (!ctx) throw new FallbackServiceError("Canvas context failed", "CANVAS_ERROR", false);

        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, maxWidth, totalHeight);

        let currentY = 0;
        for (const p of pageImages) {
            ctx.drawImage(p.img, 0, currentY);
            currentY += p.height;
            // Draw a separator line
            ctx.beginPath();
            ctx.moveTo(0, currentY);
            ctx.lineTo(maxWidth, currentY);
            ctx.strokeStyle = "#cccccc";
            ctx.stroke();
        }

        // Compress to JPEG
        return stitchedCanvas.toDataURL('image/jpeg', 0.85).split(',')[1];
    } catch (e) {
        if (e instanceof FallbackServiceError) throw e;
        const msg = e instanceof Error ? e.message : String(e);
        throw new FallbackServiceError(msg || "PDF konnte nicht für OCR konvertiert werden.", "PDF_CONVERSION_ERROR", false, e);
    }
}

/**
 * Core API call with timeout and retry logic
 */
async function callVisionAPI(
  base64Data: string,
  retryCount: number = 0
): Promise<any> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error("Request timeout")), CONFIG.timeoutMs);
  });

  const apiPromise = fetch(CONFIG.apiUrl, {
    method: "POST",
    headers: {
        "Authorization": `Bearer ${CONFIG.apiKey}`,
        "Content-Type": "application/json"
    },
    body: JSON.stringify({
        model: CONFIG.model,
        messages: [
            {
                role: "user",
                content: [
                    { type: "text", text: SYSTEM_PROMPT_VISION },
                    {
                        type: "image_url",
                        image_url: { url: `data:image/jpeg;base64,${base64Data}` }
                    }
                ]
            }
        ],
        temperature: 0.1,
        max_tokens: 2048
    })
  });

  try {
    const response = await Promise.race([apiPromise, timeoutPromise]);

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Vision API Error (${response.status}): ${errText}`);
    }

    return await response.json();
  } catch (error: any) {
    // Check if error is retryable
    const isRetryable =
      error.message?.includes("429") ||
      error.message?.includes("503") ||
      error.message?.includes("502") ||
      error.message?.includes("Quota") ||
      error.message?.includes("timeout") ||
      error.message?.includes("Vision API Error (5");

    if (isRetryable && retryCount < CONFIG.maxRetries) {
      console.warn(`⚠️  Vision API error (attempt ${retryCount + 1}/${CONFIG.maxRetries}): ${error.message}`);
      console.log(`⏳ Retrying in ${CONFIG.retryDelayMs}ms...`);

      await delay(CONFIG.retryDelayMs);
      return callVisionAPI(base64Data, retryCount + 1);
    }

    throw new FallbackServiceError(
      `Vision API call failed: ${error.message || "Unknown error"}`,
      isRetryable ? "API_RETRY_EXHAUSTED" : "API_ERROR",
      false,
      error
    );
  }
}

/**
 * Parses and validates JSON response from vision model
 */
function parseVisionResponse(responseData: any): any {
  let content = responseData.choices?.[0]?.message?.content;

  if (!content) {
    throw new FallbackServiceError("Empty response from Vision Model", "EMPTY_RESPONSE", false);
  }

  // Clean JSON Output
  content = content.trim();
  if (content.includes('```json')) {
    content = content.split('```json')[1].split('```')[0];
  } else if (content.includes('```')) {
    content = content.split('```')[1].split('```')[0];
  }

  // Fallback cleanup
  const firstBrace = content.indexOf('{');
  const lastBrace = content.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1) {
    content = content.substring(firstBrace, lastBrace + 1);
  }

  let parsed: any;
  try {
    parsed = JSON.parse(content);
  } catch (parseError: any) {
    throw new FallbackServiceError(
      `JSON parse error: ${parseError.message}. Raw response: ${content.substring(0, 200)}...`,
      "JSON_PARSE_ERROR",
      false
    );
  }

  if (!parsed || typeof parsed !== "object") {
    throw new FallbackServiceError("Invalid response format: expected JSON object", "INVALID_FORMAT", false);
  }

  return parsed;
}

/**
 * Core vision model analysis
 */
async function analyzeWithVisionModel(
  base64Data: string,
  mimeType: string,
  userId: string
): Promise<Partial<ExtractedData>> {
  const startTime = PerformanceMonitor.now();
  const operationId = `vision-ocr-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  try {
    console.log(`🔍 [${operationId}] Starting Vision OCR analysis...`);

    // Step 1: Validate inputs
    console.log(`📋 [${operationId}] Validating input data...`);
    validateInputData(base64Data, mimeType);

    // Step 2: Check rate limit
    console.log(`⏱️  [${operationId}] Checking rate limit...`);
    await checkRateLimit(userId);

    // Step 3: Check API key
    if (!CONFIG.apiKey) {
      throw new FallbackServiceError(
        "SiliconFlow API Key nicht konfiguriert. Bitte SILICONFLOW_API_KEY in .env setzen.",
        "MISSING_API_KEY",
        false
      );
    }

    // Step 4: Pre-process Input
    console.log(`📄 [${operationId}] Processing input...`);
    let finalBase64 = base64Data;

    if (mimeType === 'application/pdf') {
      finalBase64 = await convertPdfToStitchedImage(base64Data);
    }

    // Step 5: Call Vision API
    console.log(`🤖 [${operationId}] Calling Vision API...`);
    const responseData = await callVisionAPI(finalBase64);

    // Step 6: Parse response
    console.log(`📦 [${operationId}] Parsing AI response...`);
    const parsed = parseVisionResponse(responseData);

    // Step 7: Normalize data
    console.log(`✅ [${operationId}] Normalizing extracted data...`);
    const normalized = normalizeExtractedData(parsed);

    // Step 8: Add metadata
    normalized.ocr_provider = "siliconflow";
    normalized.ocr_confidence = "high";
    normalized.ocr_rationale = `Vision AI (High Res) - Operation ID: ${operationId}`;

    const duration = PerformanceMonitor.now() - startTime;
    console.log(`✅ [${operationId}] Vision OCR completed in ${duration.toFixed(2)}ms`);

    return normalized;

  } catch (error: any) {
    const duration = PerformanceMonitor.now() - startTime;
    console.error(`❌ [${operationId}] Vision OCR failed after ${duration.toFixed(2)}ms`, error);

    // Log to performance monitor
    PerformanceMonitor.recordMetric("vision_ocr_failure", {
      operationId,
      duration,
      error: error.message,
      errorCode: error.code || "UNKNOWN"
    });

    // Don't retry on rate limit or invalid input
    if (error instanceof FallbackServiceError) {
      if (error.code === "RATE_LIMIT_EXCEEDED" || error.code === "INVALID_INPUT") {
        throw error;
      }
    }

    // Return safe fallback
    return {
      belegDatum: new Date().toISOString().split('T')[0],
      lieferantName: "Manuelle Eingabe erforderlich",
      bruttoBetrag: 0,
      textContent: "",
      beschreibung: "Analyse fehlgeschlagen. Bitte manuell erfassen.",
      ocr_provider: "failed",
      ocr_confidence: "none",
      ocr_rationale: toUserFriendlyFallbackReason(error),
      error: error instanceof Error ? error.message : "Unknown error"
    } as Partial<ExtractedData>;
  }
}

/**
 * Main Fallback Function
 */
export const analyzeDocumentWithFallback = async (
  base64Data: string,
  mimeType: string,
  userId: string = "anonymous"
): Promise<Partial<ExtractedData>> => {
  try {
    return await analyzeWithVisionModel(base64Data, mimeType, userId);
  } catch (error) {
    console.error("❌ Fallback service failed completely:", error);

    return {
      belegDatum: new Date().toISOString().split('T')[0],
      lieferantName: "Manuelle Eingabe erforderlich",
      bruttoBetrag: 0,
      textContent: "",
      beschreibung: "Alle OCR-Ansätze fehlgeschlagen.",
      ocr_provider: "failed",
      ocr_confidence: "none",
      ocr_rationale: `Fallback komplett fehlgeschlagen: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: error instanceof Error ? error.message : "Unknown error"
    } as Partial<ExtractedData>;
  }
};

/**
 * Health check function for service monitoring
 */
export async function checkFallbackServiceHealth(): Promise<{
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

    // Check PDF.js availability
    if (!pdf || !pdf.getDocument) {
      return {
        healthy: false,
        message: "PDF.js not initialized"
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
export const siliconFlowProvider: OcrProvider = {
  analyzeDocument: analyzeDocumentWithFallback,
  healthCheck: checkFallbackServiceHealth
};

/**
 * Export for testing and debugging
 */
export const fallbackService = {
  analyzeDocumentWithFallback,
  checkFallbackServiceHealth,
  validateInputData,
  checkRateLimit,
  parseVisionResponse,
  CONFIG
};

