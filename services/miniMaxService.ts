/**
 * MiniMax Text Generation Service
 * Für Text-Aufgaben (z.B. Kategorisierung, Zusammenfassungen)
 * NICHT für OCR (dafür: geminiService.ts → fallbackService.ts)
 */

const MINIMAX_API_URL = "https://api.minimax.chat/v1/text/chatcompletion_v2";

// MiniMax Text Modelle - abab6.5s-chat ist schnell und kostengünstig
const MINI_MAX_MODEL = "abab6.5s-chat";

// Helper to get API key at runtime (not module load time)
function getApiKey(): string {
  return process.env.MINIMAX_API_KEY || '';
}

export interface MiniMaxResponse {
  text: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

/**
 * Generate text using MiniMax API
 */
export async function generateText(
  prompt: string,
  options?: {
    maxTokens?: number;
    temperature?: number;
    systemPrompt?: string;
  }
): Promise<MiniMaxResponse> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("MiniMax API Key nicht konfiguriert. Bitte MINIMAX_API_KEY in .env setzen.");
  }

  const messages: Array<{ role: string; content: string }> = [];

  if (options?.systemPrompt) {
    messages.push({ role: "system", content: options.systemPrompt });
  }

  messages.push({ role: "user", content: prompt });

  const response = await fetch(MINIMAX_API_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: MINI_MAX_MODEL,
      messages,
      max_tokens: options?.maxTokens ?? 1024,
      temperature: options?.temperature ?? 0.7,
      top_p: 0.95
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`MiniMax API Error (${response.status}): ${errorText}`);
  }

  const data = await response.json();

  // MiniMax response structure
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("Leere Antwort von MiniMax API");
  }

  return {
    text: content,
    usage: data.usage
  };
}

/**
 * Simple chat completion
 */
export async function chat(prompt: string): Promise<string> {
  const response = await generateText(prompt);
  return response.text;
}

/**
 * Categorize a document based on its content
 */
export async function categorizeDocument(
  textContent: string,
  categories: string[]
): Promise<string> {
  const response = await generateText(
    `Kategorisiere folgenden Text. Wähle aus: ${categories.join(", ")}\n\nText: ${textContent.substring(0, 1000)}`,
    {
      systemPrompt: "Du bist ein Accounting-Kategorisierungsassistent. Antworte nur mit der Kategorie.",
      temperature: 0.3,
      maxTokens: 50
    }
  );

  return response.text.trim();
}

/**
 * Summarize text content
 */
export async function summarizeText(
  text: string,
  maxLength: number = 200
): Promise<string> {
  const response = await generateText(
    `Fasse kurz zusammen (max ${maxLength} Zeichen): ${text.substring(0, 3000)}`,
    {
      systemPrompt: "Du bist ein Assistent für Buchhaltungszusammenfassungen.",
      temperature: 0.5,
      maxTokens: maxLength
    }
  );

  return response.text.trim();
}
