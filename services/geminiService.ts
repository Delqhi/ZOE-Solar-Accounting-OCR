
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { ExtractedData, OcrProvider } from "../types";
import { analyzeDocumentWithFallback } from "./fallbackService";
import { normalizeExtractedData } from "./extractedDataNormalization";
import { logger } from "../../src/utils/logger";

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

const accountingSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    belegDatum: { type: Type.STRING, description: "YYYY-MM-DD" },
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
        }
      }
    },
    textContent: { type: Type.STRING, description: "Summary of visible text for categorization keywords" },
    beschreibung: { type: Type.STRING },
    kontogruppe: { type: Type.STRING, description: "Calculated by rule engine later" }
  },
  required: ["belegDatum", "lieferantName", "bruttoBetrag"]
};

// IMPROVED PROMPT WITH MATH VERIFICATION
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

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Reduced retries to 1 to switch to fallback faster
async function generateWithRetry(model: string, params: any, config: any, retries = 1): Promise<any> {
    try {
        return await ai.models.generateContent({
            model,
            contents: params,
            config
        });
    } catch (error: any) {
        const isTransient = error.status === 429 || error.status === 503 || error.message?.includes("429") || error.message?.includes("503") || error.message?.includes("Quota");
        if (isTransient && retries > 0) {
            logger.warn(`Gemini busy (429/503). Retrying once in 1500ms...`);
            await delay(1500);
            return generateWithRetry(model, params, config, retries - 1);
        }
        throw error;
    }
}

export const analyzeDocumentWithGemini = async (base64Data: string, mimeType: string): Promise<Partial<ExtractedData>> => {
  try {
    // Attempt Primary: Gemini 2.5 Flash
    const response = await generateWithRetry(
      "gemini-2.5-flash",
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
        temperature: 0, // Keep 0 to reduce hallucination
      }
    );

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    // Robust JSON parsing handling potential markdown wrappers
    let jsonString = text.trim();
    if (jsonString.startsWith('```json')) {
        jsonString = jsonString.replace(/^```json/, '').replace(/```$/, '');
    } else if (jsonString.startsWith('```')) {
        jsonString = jsonString.replace(/^```/, '').replace(/```$/, '');
    }
    
    let parsed;
    try {
      parsed = JSON.parse(jsonString);
    } catch (parseError: any) {
      throw new Error(`JSON parse error: ${parseError.message}. Raw response: ${jsonString.substring(0, 200)}...`);
    }
    return normalizeExtractedData(parsed);

  } catch (error: any) {
    logger.warn("Gemini OCR Error (or Quota limit). Switching to Fallback Service immediately.", error);

    const geminiMsg = (() => {
        const status = error?.status ? ` (HTTP ${error.status})` : '';
        const msg = typeof error?.message === 'string' ? error.message : '';
        const base = (msg || 'Unbekannter Fehler').replace(/\s+/g, ' ').trim();
        return (base + status).trim();
    })();

    // UNCONDITIONAL FALLBACK:
    // We still return an object, but we keep a clear, user-actionable rationale.
    const fallback = await analyzeDocumentWithFallback(base64Data, mimeType);
    const normalized = normalizeExtractedData(fallback);
    const existing = normalized.ocr_rationale ? normalized.ocr_rationale.trim() : '';
    const prefix = `Gemini fehlgeschlagen: ${geminiMsg}`;
    normalized.ocr_rationale = existing ? `${prefix} | ${existing}` : prefix;
    return normalized;
  }
};

// OCR Provider implementation
export const geminiProvider: OcrProvider = {
  analyzeDocument: analyzeDocumentWithGemini
};
