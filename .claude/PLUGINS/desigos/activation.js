/**
 * desigOS Auto-Activation Module
 * Detects desigOS keywords and activates framework
 */

const fs = require('fs');
const path = require('path');

const CLAUDE_DIR = path.join(process.env.HOME, '.claude');

// Keywords that trigger desigOS
const DESIGOS_TRIGGERS = [
  'desigOS',
  'design system',
  'design tokens',
  'theme',
  'component library',
  'ui kit',
  'design language',
  'figma',
  'design system',
  'responsive layout',
  'dark mode',
  'design pattern',
  'design token',
  'design system'
];

// Check if prompt contains desigOS keywords
function shouldActivateDesigOS(prompt) {
  const lowerPrompt = prompt.toLowerCase();
  return DESIGOS_TRIGGERS.some(keyword =>
    lowerPrompt.includes(keyword.toLowerCase())
  );
}

// Get desigOS configuration
function getDesigOSConfig() {
  const configPath = path.join(CLAUDE_DIR, 'desigos.json');
  if (fs.existsSync(configPath)) {
    return JSON.parse(fs.readFileSync(configPath, 'utf8'));
  }
  return null;
}

// Get style guide
function getDesigOSGuide() {
  const guidePath = path.join(CLAUDE_DIR, 'DESIGOS_GUIDE.md');
  if (fs.existsSync(guidePath)) {
    return fs.readFileSync(guidePath, 'utf8');
  }
  return null;
}

// Generate desigOS prompt enhancement
function enhancePromptWithDesigOS(prompt) {
  const config = getDesigOSConfig();
  const guide = getDesigOSGuide();

  if (!config || !guide) {
    return prompt;
  }

  return [prompt,
    '',
    '---',
    '## desigOS Framework Active',
    '',
    '### Design Tokens (Use these exclusively):',
    JSON.stringify(config.theme, null, 2),
    '',
    '### Component Patterns:',
    '- Buttons: primary, secondary, outline, ghost variants',
    '- Inputs: filled, outline, underline variants',
    '- Cards: elevated, outlined, filled variants',
    '- Layout: stack, grid, flex, cluster patterns',
    '',
    '### Rules:',
    JSON.stringify(config.rules, null, 2),
    '',
    '### Reference: DESIGOS_GUIDE.md for complete patterns'
  ].join("\n");
}

// Log activation
function logActivation(prompt) {
  console.log('🔵 desigOS: Framework activated');
  console.log('   Keywords detected:', DESIGOS_TRIGGERS.filter(k =>
    prompt.toLowerCase().includes(k.toLowerCase())
  ).join(', '));
}

module.exports = {
  shouldActivateDesigOS,
  getDesigOSConfig,
  getDesigOSGuide,
  enhancePromptWithDesigOS,
  logActivation,
  DESIGOS_TRIGGERS
};