import { defineConfig } from 'vitest/config';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Read .env file manually
const envPath = resolve(__dirname, '.env');
let minimaxKey = '';
try {
  const envContent = readFileSync(envPath, 'utf-8');
  const match = envContent.match(/MINIMAX_API_KEY="([^"]*)"/);
  minimaxKey = match ? match[1] : '';
} catch (e) {
  // .env may not exist in test environment
}

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['**/*.test.ts'],
    setupFiles: ['./services/__tests__/vitest.node-setup.ts'],
    define: {
      'process.env.MINIMAX_API_KEY': JSON.stringify(minimaxKey)
    },
  },
});
