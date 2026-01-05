/**
 * Vitest Setup File
 * Production-ready test configuration with comprehensive mocks
 * Implements 2026 best practices for testing infrastructure
 */

import '@testing-library/jest-dom';
import { beforeAll, afterEach, afterAll, vi } from 'vitest';

// ========================================
// GLOBAL TEST CONFIGURATION
// ========================================

// Suppress React 18/19 act() warnings in tests
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

// ========================================
// BROWSER API MOCKS
// ========================================

/**
 * IndexedDB Mock Implementation
 * Provides full CRUD operations for testing storageService
 */
class MockIDBFactory {
  private dbMap = new Map<string, MockIDBDatabase>();

  async open(name: string, version?: number): Promise<MockIDBDatabase> {
    if (!this.dbMap.has(name)) {
      this.dbMap.set(name, new MockIDBDatabase(name, version || 1));
    }
    return this.dbMap.get(name)!;
  }

  async deleteDatabase(name: string): Promise<void> {
    this.dbMap.delete(name);
  }

  async databases(): Promise<Array<{ name: string; version: number }>> {
    return Array.from(this.dbMap.entries()).map(([name, db]) => ({
      name,
      version: db.version
    }));
  }
}

class MockIDBDatabase {
  name: string;
  version: number;
  stores = new Map<string, Map<string, any>>();

  constructor(name: string, version: number) {
    this.name = name;
    this.version = version;
  }

  transaction(storeNames: string | string[], mode: string = 'readonly'): MockIDBTransaction {
    const names = Array.isArray(storeNames) ? storeNames : [storeNames];
    return new MockIDBTransaction(this, names, mode);
  }

  createObjectStore(name: string): MockIDBObjectStore {
    const store = new MockIDBObjectStore(name);
    this.stores.set(name, store);
    return store;
  }

  close(): void {
    // No-op for mock
  }
}

class MockIDBTransaction {
  db: MockIDBDatabase;
  storeNames: string[];
  mode: string;
  error: Error | null = null;

  constructor(db: MockIDBDatabase, storeNames: string[], mode: string) {
    this.db = db;
    this.storeNames = storeNames;
    this.mode = mode;
  }

  objectStore(name: string): MockIDBObjectStore {
    if (!this.db.stores.has(name)) {
      this.db.stores.set(name, new MockIDBObjectStore(name));
    }
    return this.db.stores.get(name)!;
  }

  commit(): void {
    // No-op for mock
  }

  abort(error?: Error): void {
    this.error = error || new Error('Transaction aborted');
  }
}

class MockIDBObjectStore {
  name: string;
  data = new Map<string, any>();

  constructor(name: string) {
    this.name = name;
  }

  async get(key: string): Promise<any> {
    return this.data.get(key);
  }

  async getAll(): Promise<any[]> {
    return Array.from(this.data.values());
  }

  async put(value: any, key?: string): Promise<string> {
    const id = key || value.id || crypto.randomUUID();
    this.data.set(id, { ...value, id });
    return id;
  }

  async delete(key: string): Promise<void> {
    this.data.delete(key);
  }

  async clear(): Promise<void> {
    this.data.clear();
  }

  async count(): Promise<number> {
    return this.data.size;
  }

  index(name: string): MockIDBIndex {
    return new MockIDBIndex(name, this);
  }

  createIndex(name: string, keyPath: string, options?: { unique: boolean }): MockIDBIndex {
    return new MockIDBIndex(name, this);
  }
}

class MockIDBIndex {
  name: string;
  store: MockIDBObjectStore;

  constructor(name: string, store: MockIDBObjectStore) {
    this.name = name;
    this.store = store;
  }

  async getAll(): Promise<any[]> {
    return Array.from(this.store.data.values());
  }

  async get(key: string): Promise<any> {
    // Simple mock - just return from store
    return this.store.data.get(key);
  }
}

// Mock global indexedDB
global.indexedDB = new MockIDBFactory() as any;

// ========================================
// CRYPTO API MOCKS
// ========================================

// Mock crypto.randomUUID and crypto.subtle using Object.defineProperty
// to handle read-only properties in Node.js environment
let mockUUIDCounter = 0;

if (!global.crypto) {
  Object.defineProperty(global, 'crypto', {
    writable: true,
    configurable: true,
    value: {
      randomUUID: vi.fn(() => {
        mockUUIDCounter++;
        return `mock-uuid-${mockUUIDCounter}-${Date.now()}`;
      }),
      subtle: {
        digest: vi.fn(async (algorithm: string, data: BufferSource): Promise<ArrayBuffer> => {
          // Simple mock hash - just return the data length as bytes
          const length = data instanceof ArrayBuffer ? data.byteLength :
                         data instanceof Uint8Array ? data.length :
                         (data as any).length || 0;
          const hash = new Uint8Array(32);
          hash[0] = length % 256;
          return hash.buffer;
        })
      }
    }
  });
} else {
  // crypto exists, need to handle subtle separately
  if (!global.crypto.randomUUID) {
    Object.defineProperty(global.crypto, 'randomUUID', {
      writable: true,
      configurable: true,
      value: vi.fn(() => {
        mockUUIDCounter++;
        return `mock-uuid-${mockUUIDCounter}-${Date.now()}`;
      })
    });
  }

  if (!global.crypto.subtle) {
    Object.defineProperty(global.crypto, 'subtle', {
      writable: true,
      configurable: true,
      value: {
        digest: vi.fn(async (algorithm: string, data: BufferSource): Promise<ArrayBuffer> => {
          const length = data instanceof ArrayBuffer ? data.byteLength :
                         data instanceof Uint8Array ? data.length :
                         (data as any).length || 0;
          const hash = new Uint8Array(32);
          hash[0] = length % 256;
          return hash.buffer;
        })
      }
    });
  }
}

// ========================================
// LOCAL STORAGE MOCK
// ========================================

class MockLocalStorage {
  private storage = new Map<string, string>();

  getItem(key: string): string | null {
    return this.storage.get(key) || null;
  }

  setItem(key: string, value: string): void {
    this.storage.set(key, value);
  }

  removeItem(key: string): void {
    this.storage.delete(key);
  }

  clear(): void {
    this.storage.clear();
  }

  get length(): number {
    return this.storage.size;
  }

  key(index: number): string | null {
    return Array.from(this.storage.keys())[index] || null;
  }
}

global.localStorage = new MockLocalStorage() as any;

// ========================================
// FILE API MOCKS
// ========================================

// Mock FileReader
global.FileReader = class FileReader {
  onload: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null = null;
  onerror: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null = null;
  result: string | ArrayBuffer | null = null;
  readyState: number = 0;

  readAsDataURL(file: Blob): void {
    setTimeout(() => {
      if (this.onload) {
        this.result = `data:${file.type};base64,bW9ja2RhdGE=`; // "mockdata" in base64
        this.onload.call(this, new ProgressEvent('load', { loaded: 100, total: 100 }));
      }
    }, 0);
  }

  abort(): void {
    this.readyState = 0;
    this.result = null;
  }

  static EMPTY = 0;
  static LOADING = 1;
  static DONE = 2;
} as any;

// ========================================
// WINDOW & NAVIGATOR MOCKS
// ========================================

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock PerformanceObserver
class MockPerformanceObserver {
  private callback: (list: { getEntries: () => any[] }) => void;

  constructor(callback: (list: { getEntries: () => any[] }) => void) {
    this.callback = callback;
  }

  observe = vi.fn();
  disconnect = vi.fn();
  takeRecords = vi.fn(() => []);
}

global.PerformanceObserver = MockPerformanceObserver as any;

// Mock performance.now() for PerformanceMonitor
// Keep track of time manually for testing
let mockTime = 0;
Object.defineProperty(global, 'performance', {
  writable: true,
  configurable: true,
  value: {
    now: vi.fn(() => {
      mockTime += 1; // Increment by 1ms each call for predictable timing
      return mockTime;
    }),
    mark: vi.fn(),
    measure: vi.fn(),
    timeOrigin: Date.now(),
  },
});

// Mock navigator.clipboard
Object.defineProperty(navigator, 'clipboard', {
  writable: true,
  value: {
    writeText: vi.fn().mockResolvedValue(undefined),
    readText: vi.fn().mockResolvedValue(''),
  },
});

// Mock window.URL
global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
global.URL.revokeObjectURL = vi.fn();

// ========================================
// REACT TESTING UTILITIES
// ========================================

// Mock console methods to reduce noise in tests
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeAll(() => {
  // Suppress React 18/19 warnings about act()
  console.error = (...args: any[]) => {
    const message = args.join(' ');
    if (
      message.includes('act(...)') ||
      message.includes('update was not wrapped in act(...)') ||
      message.includes('not wrapped in act(...)') ||
      message.includes('Warning: An update to')
    ) {
      return; // Suppress React act warnings
    }
    originalConsoleError(...args);
  };

  console.warn = (...args: any[]) => {
    const message = args.join(' ');
    if (
      message.includes('ReactDOMTestUtils') ||
      message.includes('experimental')
    ) {
      return; // Suppress test utils warnings
    }
    originalConsoleWarn(...args);
  };
});

// ========================================
// ENVIRONMENT VARIABLES FOR TESTS
// ========================================

// Set required environment variables for tests
process.env.VITE_GEMINI_API_KEY = 'test-gemini-api-key';
process.env.VITE_SILICONFLOW_API_KEY = 'test-siliconflow-api-key';
process.env.VITE_SUPABASE_URL = 'https://test.supabase.co';
process.env.VITE_SUPABASE_ANON_KEY = 'test-anon-key';

// ========================================
// MSW (Mock Service Worker) SETUP
// ========================================
// Note: MSW would be used for API mocking in integration tests
// For now, we provide basic fetch mocking utilities

/**
 * Mock fetch for testing external API calls
 */
export const mockFetch = vi.fn();
global.fetch = mockFetch;

/**
 * Setup mock response for fetch
 */
export function setupFetchMock(
  response: any,
  status: number = 200,
  delay: number = 0
): void {
  mockFetch.mockImplementation(() => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          ok: status >= 200 && status < 300,
          status,
          json: async () => response,
          text: async () => JSON.stringify(response),
          headers: new Headers(),
        } as Response);
      }, delay);
    });
  });
}

/**
 * Reset all mocks
 */
export function resetAllMocks(): void {
  mockFetch.mockClear();
  vi.clearAllMocks();
}

// ========================================
// CUSTOM MATCHERS
// ========================================

// Add custom matchers for testing
expect.extend({
  toBeWithinRange(received: number, floor: number, ceiling: number) {
    const pass = received >= floor && received <= ceiling;
    if (pass) {
      return {
        message: () => `expected ${received} not to be within range ${floor} - ${ceiling}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be within range ${floor} - ${ceiling}`,
        pass: false,
      };
    }
  },

  toContainError(received: any, expected: string) {
    const pass = received &&
                 (received.error === expected ||
                  received.message === expected ||
                  (Array.isArray(received.errors) && received.errors.includes(expected)));

    if (pass) {
      return {
        message: () => `expected not to contain error "${expected}"`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected to contain error "${expected}", but got: ${JSON.stringify(received)}`,
        pass: false,
      };
    }
  }
});

// ========================================
// TEST UTILITIES
// ========================================

/**
 * Wait for a condition to be true
 */
export async function waitForCondition(
  condition: () => boolean,
  timeout: number = 1000,
  interval: number = 50
): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (condition()) return;
    await new Promise(resolve => setTimeout(resolve, interval));
  }
  throw new Error(`Condition not met within ${timeout}ms`);
}

/**
 * Create a mock DocumentRecord for testing
 */
export function createMockDocument(overrides: Partial<any> = {}) {
  return {
    id: `doc-${Date.now()}`,
    fileName: 'test-invoice.pdf',
    fileType: 'application/pdf',
    uploadDate: new Date().toISOString(),
    status: 'PROCESSING',
    data: null,
    previewUrl: 'data:application/pdf;base64,dGVzdA==',
    fileHash: 'mock-hash',
    ...overrides,
  };
}

/**
 * Create a mock ExtractedData for testing
 */
export function createMockExtractedData(overrides: Partial<any> = {}) {
  return {
    belegDatum: '2024-01-15',
    belegNummerLieferant: 'INV-12345',
    lieferantName: 'Test Supplier GmbH',
    lieferantAdresse: 'Teststraße 1, 12345 Berlin',
    bruttoBetrag: 119.00,
    nettoBetrag: 100.00,
    mwstSatz19: 0.19,
    mwstBetrag19: 19.00,
    mwstSatz7: 0,
    mwstBetrag7: 0,
    mwstSatz0: 0,
    mwstBetrag0: 0,
    steuerkategorie: '19_pv',
    kontierungskonto: 'wareneingang',
    lineItems: [],
    ...overrides,
  };
}

// ========================================
// GLOBAL TEARDOWN
// ========================================

afterEach(() => {
  // Clear all mocks
  vi.clearAllMocks();

  // Reset localStorage
  (global.localStorage as any).storage?.clear?.();

  // Reset IndexedDB
  (global.indexedDB as any).databases?.clear?.();

  // Reset mock counter
  mockUUIDCounter = 0;

  // Clear any pending timers
  vi.useFakeTimers().clearAllTimers();
});

afterAll(() => {
  // Restore console
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;

  // Clean up any global state
  mockUUIDCounter = 0;
});

// ========================================
// TYPE DECLARATIONS FOR TYPESCRIPT
// ========================================

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
  var crypto: {
    randomUUID: () => string;
    subtle: {
      digest: (algorithm: string, data: BufferSource) => Promise<ArrayBuffer>;
    };
  };
  var indexedDB: MockIDBFactory;
}

// Export for use in test files
export {};
