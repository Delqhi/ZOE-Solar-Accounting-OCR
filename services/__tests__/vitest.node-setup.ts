/**
 * Node.js setup for service tests
 * This file mocks Node.js-specific globals needed for testing
 */
import { vi } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

// Load .env file for test environment
const envPath = resolve(__dirname, '../../.env');
if (existsSync(envPath)) {
  const envContent = readFileSync(envPath, 'utf-8');
  const match = envContent.match(/MINIMAX_API_KEY="([^"]*)"/);
  if (match) {
    process.env.MINIMAX_API_KEY = match[1];
  }
}

// Mock window for Node.js environment if needed
globalThis.window = {
  matchMedia: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }))
} as unknown as Window & typeof globalThis;

// Mock ResizeObserver
globalThis.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));
