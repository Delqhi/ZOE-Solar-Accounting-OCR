/**
 * Vitest Configuration
 * Production-ready with 2026 best practices
 * Comprehensive coverage and advanced testing settings
 */

import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  // Resolve aliases at root level
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@tests': resolve(__dirname, './tests'),
      '@services': resolve(__dirname, './src/services'),
      '@utils': resolve(__dirname, './src/utils'),
      '@components': resolve(__dirname, './src/components'),
    },
  },
  test: {
    // Environment
    environment: 'jsdom',
    globals: true,

    // Test file discovery
    include: [
      '**/*.test.{ts,tsx}',
      'tests/**/*.test.{ts,tsx}',
      '**/*.spec.{ts,tsx}',
      'tests/**/*.spec.{ts,tsx}'
    ],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.{git,cache}/**',
      '**/*.config.{ts,js}',
      '**/vitest.setup.ts'
    ],

    // Setup files
    setupFiles: ['./vitest.setup.ts'],

    // Coverage
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      exclude: [
        '**/node_modules/**',
        '**/dist/**',
        '**/*.config.{ts,js}',
        '**/vitest.setup.ts',
        '**/tests/**',
        '**/*.test.{ts,tsx}',
        '**/*.spec.{ts,tsx}',
        '**/*.d.ts',
        '**/index.ts',
        '**/main.tsx'
      ],
      thresholds: {
        // Overall thresholds
        lines: 80,
        functions: 80,
        branches: 75,
        statements: 80,

        // Per-file thresholds
        perFile: true,

        // Exclude type-only files
        excludeAfterRemap: true
      }
    },

    // Performance
    testTimeout: 10000,
    hookTimeout: 5000,
    teardownTimeout: 5000,

    // Pool configuration
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: false,
        isolate: true
      }
    },

    // Minify output
    minWorkers: 1,
    maxWorkers: '50%',

    // Mock options
    clearMocks: true,
    restoreMocks: true,

    // Pass with no tests (for edge cases)
    passWithNoTests: false,

    // Watch mode
    watchExclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/coverage/**',
      '**/.git/**'
    ],

    // reporters
    reporters: ['verbose'],

    // Log errors only
    silent: false,

    // Update snapshots
    updateSnapshot: 'none',

    // Allow test failures to be reported
    allowOnly: true,
  },
});
