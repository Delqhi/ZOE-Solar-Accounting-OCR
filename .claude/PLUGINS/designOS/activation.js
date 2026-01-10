/**
 * designOS Auto-Activation Module
 * Detects designOS keywords and activates framework
 */

const fs = require('fs');
const path = require('path');

const CLAUDE_DIR = path.join(process.env.HOME, '.claude');

// Keywords that trigger designOS
const DESIGNOS_TRIGGERS = [
  'designOS',
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

// Check if prompt contains designOS keywords
function shouldActivateDesigOS(prompt) {
  const lowerPrompt = prompt.toLowerCase();
  return DESIGNOS_TRIGGERS.some(keyword =>
    lowerPrompt.includes(keyword.toLowerCase())
  );
}

// Get designOS configuration
function getDesigOSConfig() {
  const configPath = path.join(CLAUDE_DIR, 'designOS.json');
  if (fs.existsSync(configPath)) {
    return JSON.parse(fs.readFileSync(configPath, 'utf8'));
  }
  return null;
}

// Get style guide
function getDesigOSGuide() {
  const guidePath = path.join(CLAUDE_DIR, 'DESIGNOS_GUIDE.md');
  if (fs.existsSync(guidePath)) {
    return fs.readFileSync(guidePath, 'utf8');
  }
  return null;
}

// Generate designOS prompt enhancement
function enhancePromptWithDesigOS(prompt) {
  const config = getDesigOSConfig();
  const guide = getDesigOSGuide();

  if (!config || !guide) {
    return prompt;
  }

  return [prompt,
    '',
    '---',
    '## designOS Framework Active',
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
    '### Reference: DESIGNOS_GUIDE.md for complete patterns'
  ].join("\n");
}

// Log activation
function logActivation(prompt) {
  console.log('🔵 designOS: Framework activated');
  console.log('   Keywords detected:', DESIGNOS_TRIGGERS.filter(k =>
    prompt.toLowerCase().includes(k.toLowerCase())
  ).join(', '));
}

module.exports = {
  shouldActivateDesigOS,
  getDesigOSConfig,
  getDesigOSGuide,
  enhancePromptWithDesigOS,
  logActivation,
  DESIGNOS_TRIGGERS
};