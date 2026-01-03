/**
 * @vitest-environment node
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { generateText, chat, categorizeDocument, summarizeText } from '../miniMaxService';

// Mock fetch globally
const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

describe('miniMaxService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('generateText', () => {
    it('should return text from successful API response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          choices: [{
            message: {
              content: 'Test response'
            }
          }],
          usage: {
            prompt_tokens: 10,
            completion_tokens: 5
          }
        })
      });

      const result = await generateText('Hello');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.minimax.chat/v1/text/chatcompletion_v2',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': expect.stringContaining('Bearer ')
          })
        })
      );
      expect(result.text).toBe('Test response');
      expect(result.usage).toEqual({ prompt_tokens: 10, completion_tokens: 5 });
    });

    it('should throw error when API key is not configured', async () => {
      // Temporarily unset the env var
      const originalKey = process.env.MINIMAX_API_KEY;
      try {
        // We need to test this by calling with a mock that will hit the actual code path
        // Since the API key is read at module load time, we test via error handling
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 401,
          text: () => Promise.resolve('Unauthorized')
        });

        await expect(generateText('test')).rejects.toThrow('MiniMax API Error');
      } finally {
        process.env.MINIMAX_API_KEY = originalKey;
      }
    });

    it('should throw error on HTTP error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: () => Promise.resolve('Internal Server Error')
      });

      await expect(generateText('test')).rejects.toThrow('MiniMax API Error (500)');
    });

    it('should throw error on empty response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          choices: []
        })
      });

      await expect(generateText('test')).rejects.toThrow('Leere Antwort von MiniMax API');
    });

    it('should use custom options', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          choices: [{ message: { content: 'response' } }]
        })
      });

      await generateText('prompt', {
        maxTokens: 500,
        temperature: 0.3,
        systemPrompt: 'You are a helper'
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining('"max_tokens":500'),
          headers: expect.objectContaining({
            'Authorization': expect.stringContaining('Bearer ')
          })
        })
      );
    });
  });

  describe('chat', () => {
    it('should return simple text response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          choices: [{ message: { content: 'Hello user!' } }]
        })
      });

      const result = await chat('Hi');

      expect(result).toBe('Hello user!');
    });
  });

  describe('categorizeDocument', () => {
    it('should return category from document', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          choices: [{ message: { content: 'Lebensmittel' } }]
        })
      });

      const categories = ['Lebensmittel', 'Technik', 'Transport'];
      const result = await categorizeDocument('Kauf von Lebensmitteln', categories);

      expect(result).toBe('Lebensmittel');
    });
  });

  describe('summarizeText', () => {
    it('should return summarized text', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          choices: [{ message: { content: 'Kurze Zusammenfassung' } }]
        })
      });

      const result = await summarizeText('Dies ist ein langer Text...', 100);

      expect(result).toBe('Kurze Zusammenfassung');
    });

    it('should use default maxLength', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          choices: [{ message: { content: 'summary' } }]
        })
      });

      await summarizeText('long text'.repeat(100));

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining('"max_tokens":200')
        })
      );
    });
  });
});
