
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { ExtractedData } from "../types";

// Define the schema for structured output
const accountingSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    belegDatum: { type: Type.STRING, description: "Date of the receipt formatted as YYYY-MM-DD" },
    belegNummerLieferant: { type: Type.STRING, description: "Invoice number from the vendor" },
    lieferantName: { type: Type.STRING, description: "Full legal name of the vendor (Lieferant)" },
    lieferantAdresse: { type: Type.STRING, description: "Address of the vendor" },
    steuernummer: { type: Type.STRING, description: "Tax ID or VAT ID of the vendor" },
    
    nettoBetrag: { type: Type.NUMBER, description: "Total Net amount excluding tax" },
    mwstSatz7: { type: Type.NUMBER, description: "The reduced tax rate (0.07) if present on the document, otherwise 0" },
    mwstBetrag7: { type: Type.NUMBER, description: "The calculated tax amount for the 7% rate" },
    mwstSatz19: { type: Type.NUMBER, description: "The standard tax rate (0.19) if present on the document, otherwise 0" },
    mwstBetrag19: { type: Type.NUMBER, description: "The calculated tax amount for the 19% rate" },
    bruttoBetrag: { type: Type.NUMBER, description: "Total Gross amount (Gesamtsumme)" },
    zahlungsmethode: { type: Type.STRING, description: "Payment method (Bar, EC, Überweisung, PayPal, Kreditkarte)" },
    
    lineItems: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          description: { type: Type.STRING },
          amount: { type: Type.NUMBER }
        }
      },
      description: "List of items/positions on the invoice"
    },

    kostenstelle: { type: Type.STRING },
    projekt: { type: Type.STRING, description: "Project name or order reference if visible" },
    
    // Status info implicitly found in text
    zahlungsDatum: { type: Type.STRING, description: "Date of payment if mentioned (YYYY-MM-DD)" },
    zahlungsStatus: { type: Type.STRING, description: "'bezahlt' if receipt indicates payment, otherwise 'offen'" },
    
    reverseCharge: { type: Type.BOOLEAN, description: "True if 'Reverse Charge' or 'Steuerschuldnerschaft' is mentioned" },
    
    beschreibung: { type: Type.STRING, description: "Short summary of the purchase content (Verwendungszweck)" },
    textContent: { type: Type.STRING, description: "Full OCR text content for rule processing" },
  },
  required: ["belegDatum", "lieferantName", "bruttoBetrag"],
};

const SYSTEM_INSTRUCTION = `
You are the OCR extraction engine for "ZOE Solar". 
Extract data EXACTLY as it appears on the document.

Context:
- The company is "ZOE Solar" (Photovoltaics).
- Documents are typically invoices (Rechnungen), receipts (Belege), or fuel receipts (Tankbelege).

Extraction Rules:
1. **Dates**: Format YYYY-MM-DD.
2. **Amounts**: 
   - Extract strictly. Use decimal point.
   - Differentiate between 7% and 19% VAT. 
   - Note: Photovoltaic components (PV modules, inverters) often have 0% tax (§12 Abs. 3 UStG). In this case, tax amounts are 0.
3. **Vendor**: Extract the full legal name.
4. **Payment**: Identify if paid by "Bar", "EC", "Überweisung", "PayPal", "Kreditkarte".
5. **Reverse Charge**: Check for keywords like "Reverse Charge", "Innergemeinschaftliche Lieferung", "Steuerschuldnerschaft".

Return raw JSON fitting the schema.
`;

export const analyzeDocumentWithGemini = async (
  base64Data: string,
  mimeType: string
): Promise<Partial<ExtractedData>> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Data,
            },
          },
          {
            text: "Extract accounting data from this invoice for ZOE Solar.",
          },
        ],
      },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: accountingSchema,
      },
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("No response from AI");
    
    return JSON.parse(jsonText) as Partial<ExtractedData>;
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
};
