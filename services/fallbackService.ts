
import { ExtractedData, OcrProvider } from "../types";
import * as pdfjsLib from 'pdfjs-dist';
import { normalizeExtractedData } from "./extractedDataNormalization";

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

// SiliconFlow API Config
const SF_API_KEY = process.env.SILICONFLOW_API_KEY;
const SF_API_URL = "https://api.siliconflow.com/v1/chat/completions";

// PDF Stitching Limits (B3)
const SF_MAX_PDF_PAGES = 3;
const SF_MAX_PDF_BYTES = 12 * 1024 * 1024; // ~12MB decoded

// Qwen 2.5 VL 72B is currently the SOTA Open Source Vision Model (Better than DeepSeek-VL)
const SF_VISION_MODEL = "Qwen/Qwen2.5-VL-72B-Instruct"; 

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
 * Helper: Resize Image Base64
 * Scales down very large images to avoid API token limits while keeping legibility.
 */
async function processImageForAI(base64Data: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = base64Data.startsWith('data:') ? base64Data : `data:image/jpeg;base64,${base64Data}`;
    });
}

/**
 * Helper: Convert PDF Pages to a Single Stitched Image (Vertical)
 * This allows the Vision AI to see the WHOLE document at once.
 */
async function convertPdfToStitchedImage(base64Pdf: string): Promise<string> {
    try {
        if (!pdf || !pdf.getDocument) throw new Error("PDF.js library not correctly initialized.");

        // Fast size check (base64 length -> bytes approx)
        // bytes ~= (len * 3/4) - padding
        const approxBytes = Math.floor((base64Pdf.length * 3) / 4);
        if (approxBytes > SF_MAX_PDF_BYTES) {
            throw new Error(`PDF ist zu groß für OCR-Stitching (>${Math.round(SF_MAX_PDF_BYTES / (1024 * 1024))}MB). Bitte PDF verkleinern oder Seiten splitten.`);
        }

        const binaryString = atob(base64Pdf);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }

        const loadingTask = pdf.getDocument({ data: bytes });
        const pdfDoc = await loadingTask.promise;
        const numPages = Math.min(pdfDoc.numPages, SF_MAX_PDF_PAGES); // Limit pages to avoid massive images

        const pageImages: { img: ImageBitmap, width: number, height: number }[] = [];
        let totalHeight = 0;
        let maxWidth = 0;

        for (let pageNum = 1; pageNum <= numPages; pageNum++) {
            const page = await pdfDoc.getPage(pageNum);
            const viewport = page.getViewport({ scale: 2.0 }); // Scale 2.0 for good OCR quality
            
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
        
        if (!ctx) throw new Error("Canvas context failed");
        
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
        console.error("PDF Stitching failed:", e);
        // Keep specific user-actionable error messages when possible (e.g. size limits)
        const msg = e instanceof Error ? e.message : String(e);
        throw new Error(msg || "PDF konnte nicht für OCR konvertiert werden.");
    }
}

const summarize = (s: string, maxLen = 280) => {
    const clean = (s || '').replace(/\s+/g, ' ').trim();
    return clean.length > maxLen ? clean.slice(0, maxLen) + '…' : clean;
};

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
        // Preserve explicit messages, otherwise provide actionable guidance
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
 * Fallback Strategy: SiliconFlow Vision (Qwen 2.5 VL)
 * Direct Image -> JSON
 */
async function analyzeWithVisionModel(base64Data: string, mimeType: string): Promise<Partial<ExtractedData>> {
    if (!SF_API_KEY) {
        throw new Error("SiliconFlow API Key nicht konfiguriert. Bitte SILICONFLOW_API_KEY in .env setzen.");
    }

    let finalBase64 = base64Data;
    
    // 1. Pre-process Input
    if (mimeType === 'application/pdf') {
        finalBase64 = await convertPdfToStitchedImage(base64Data);
    } else {
        // Ensure image isn't massive, but keep quality high
        // Simple pass-through for now as modern Vision APIs handle up to 20MB
        // If needed, we could add resize logic here
    }

    // 2. Call API
    const response = await fetch(SF_API_URL, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${SF_API_KEY}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            model: SF_VISION_MODEL,
            messages: [
                {
                    role: "user",
                    content: [
                        { type: "text", text: SYSTEM_PROMPT_VISION },
                        { 
                            type: "image_url", 
                            image_url: { url: `data:image/jpeg;base64,${finalBase64}` } 
                        }
                    ]
                }
            ],
            temperature: 0.1,
            max_tokens: 2048
        })
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Vision API Error (${response.status}): ${errText}`);
    }

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error("Empty response from Vision Model");

    // 3. Clean JSON Output
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

    const parsed = JSON.parse(content);
    return normalizeExtractedData(parsed);
}

/**
 * Main Fallback Function
 */
export const analyzeDocumentWithFallback = async (base64Data: string, mimeType: string): Promise<Partial<ExtractedData>> => {

    const failSafeObject: Partial<ExtractedData> = {
        belegDatum: new Date().toISOString().split('T')[0],
        lieferantName: "Manuelle Eingabe erforderlich",
        bruttoBetrag: 0,
        textContent: "",
        beschreibung: "KI Analyse fehlgeschlagen.",
        ocr_score: 0,
        ocr_rationale: "Fallback fehlgeschlagen. Bitte manuell erfassen."
    };

    try {
        // Exclusive use of Vision AI. 
        // We deleted Tesseract, so if this fails, we return the Empty Template.
        const data = await analyzeWithVisionModel(base64Data, mimeType);
        return { 
            ...data, 
            ocr_rationale: "Fallback: Vision AI (High Res)", 
            ocr_score: 8 
        };

    } catch (error) {
        console.error("Vision AI Fallback Failed:", error);
        const reason = toUserFriendlyFallbackReason(error);
        return {
            ...failSafeObject,
            beschreibung: "Analyse fehlgeschlagen. Bitte manuell erfassen.",
            ocr_rationale: reason
        };
    }
};

// OCR Provider implementation
export const siliconFlowProvider: OcrProvider = {
  analyzeDocument: analyzeDocumentWithFallback
};
