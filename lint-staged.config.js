/**
 * lint-staged Configuration
 * Runs before each commit to ensure code quality
 */
module.exports = {
  // TypeScript/JavaScript files
  '*.{ts,tsx}': [
    'eslint --fix --max-warnings 0',
    'prettier --write',
  ],

  // Configuration files
  '*.{js,cjs,mjs}': [
    'eslint --fix',
    'prettier --write',
  ],

  // Style files
  '*.{css,scss,less,postcss}': [
    'prettier --write',
  ],

  // Markup & Config
  '*.{json,md,mdx,yml,yaml,html}': [
    'prettier --write',
  ],

  // Package files - check for vulnerabilities
  'package.json': [
    'npm audit --audit-level=moderate',
    'prettier --write',
  ],
};
