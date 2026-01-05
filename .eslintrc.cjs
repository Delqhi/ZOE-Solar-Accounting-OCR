/**
 * ESLint Configuration for ZOE Solar Accounting OCR
 * Production-ready 2026 - Simplified for deployment
 */

module.exports = {
  root: true,
  env: {
    browser: true,
    es2020: true,
    node: true,
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'prettier',
  ],
  plugins: [
    '@typescript-eslint',
  ],
  rules: {
    // Core TypeScript rules
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-explicit-any': 'off', // Allow any for now - can be tightened later
    '@typescript-eslint/no-shadow': 'error',

    // Basic code quality
    'no-console': 'warn',
    'no-debugger': 'error',
    'prefer-const': 'error',
    'no-var': 'error',
    'eqeqeq': ['error', 'always'],

    // Disable complex rules that need additional setup
    'react/react-in-jsx-scope': 'off',
  },
  ignorePatterns: [
    'dist',
    'build',
    'node_modules',
    'coverage',
    '*.config.js',
    '*.config.ts',
    'vite.config.ts',
    'vitest.config.ts',
    'postcss.config.js',
    'tailwind.config.js',
  ],
};
