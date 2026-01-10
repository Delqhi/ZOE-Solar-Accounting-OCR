#!/usr/bin/env node
/**
 * DESIGNOS INTEGRATION MODULE
 * Version: 1.0 | Best Practices Implementation
 *
 * Integrates designOS design system framework into Claude Code workflow
 * with automatic style detection and activation.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ============================================================================
// CONFIGURATION
// ============================================================================

const CLAUDE_DIR = path.join(process.env.HOME, '.claude');
const EXECUTORS_DIR = path.join(CLAUDE_DIR, 'EXECUTORS');
const CONFIGS_DIR = path.join(CLAUDE_DIR, 'CONFIGS');
const PLUGINS_DIR = path.join(CLAUDE_DIR, 'PLUGINS');
const DESIGNOS_DIR = path.join(PLUGINS_DIR, 'designOS');

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function log(message, type = 'info') {
  const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
  const prefix = {
    'info': '🔵',
    'warn': '🟡',
    'error': '🔴',
    'success': '✅'
  }[type] || 'ℹ️';

  console.log(`${prefix} [${timestamp}] ${message}`);
}

function ensureDirectory(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    log(`Created: ${dir}`, 'success');
  }
}

function createFile(filePath, content, description) {
  try {
    fs.writeFileSync(filePath, content, 'utf8');
    log(`✓ ${description}`, 'success');
    return true;
  } catch (error) {
    log(`✗ ${description}: ${error.message}`, 'error');
    return false;
  }
}

// ============================================================================
// STEP 1: CREATE DESIGNOS CONFIGURATION
// ============================================================================

function createDesigOSConfig() {
  log('Creating designOS configuration...', 'info');

  const config = {
    name: 'designOS',
    version: '1.0',
    description: 'Design system framework for Claude Code',
    theme: {
      primary: '#0066FF',
      secondary: '#FF6B00',
      accent: '#00D4FF',
      success: '#00CC66',
      warning: '#FFB020',
      error: '#FF4757',
      background: '#0A0E14',
      surface: '#151A23',
      text: '#E6EDF3',
      muted: '#8B949E'
    },
    components: {
      button: {
        variants: ['primary', 'secondary', 'outline', 'ghost'],
        sizes: ['sm', 'md', 'lg']
      },
      input: {
        variants: ['filled', 'outline', 'underline'],
        validation: ['error', 'warning', 'success']
      },
      card: {
        variants: ['elevated', 'outlined', 'filled'],
        padding: ['none', 'sm', 'md', 'lg']
      }
    },
    patterns: {
      layout: ['stack', 'grid', 'flex', 'cluster'],
      interaction: ['hover', 'focus', 'active', 'disabled'],
      state: ['loading', 'error', 'empty', 'success']
    },
    rules: {
      spacing: '8px base unit',
      typography: 'Inter, system-ui, sans-serif',
      colors: 'Use theme tokens only',
      components: 'Use designOS components when available'
    }
  };

  const configPath = path.join(CLAUDE_DIR, 'designOS.json');
  return createFile(configPath, JSON.stringify(config, null, 2), 'designOS configuration');
}

// ============================================================================
// STEP 2: CREATE DESIGNOS STYLE GUIDE
// ============================================================================

function createDesigOSStyleGuide() {
  log('Creating designOS style guide...', 'info');

  const guideLines = [
    '# designOS Style Guide',
    '',
    '## Overview',
    'designOS is a comprehensive design system framework for Claude Code projects.',
    'It provides consistent design tokens, components, and patterns.',
    '',
    '## Design Tokens',
    '',
    '### Colors',
    '- Primary: #0066FF (Action, Links)',
    '- Secondary: #FF6B00 (Highlights, Alerts)',
    '- Accent: #00D4FF (Emphasis)',
    '- Success: #00CC66 (Positive)',
    '- Warning: #FFB020 (Caution)',
    '- Error: #FF4757 (Destructive)',
    '- Background: #0A0E14 (Dark mode base)',
    '- Surface: #151A23 (Cards, Panels)',
    '- Text: #E6EDF3 (Primary text)',
    '- Muted: #8B949E (Secondary text)',
    '',
    '### Typography',
    '- Font Family: Inter, system-ui, sans-serif',
    '- Base Size: 16px',
    '- Scale: 1.25 (Major Third)',
    '- Line Height: 1.5',
    '',
    '### Spacing',
    '- Base Unit: 8px',
    '- Scale: 0.5x, 1x, 2x, 3x, 4x, 6x, 8x',
    '',
    '## Component Patterns',
    '',
    '### Buttons',
    '```tsx',
    '// Primary action',
    '<Button variant="primary" size="md">Submit</Button>',
    '',
    '// Secondary action',
    '<Button variant="secondary" size="md">Cancel</Button>',
    '',
    '// Ghost (minimal)',
    '<Button variant="ghost" size="sm">Details</Button>',
    '```',
    '',
    '### Inputs',
    '```tsx',
    '// Filled input',
    '<Input variant="filled" placeholder="Enter text..." />',
    '',
    '// With validation',
    '<Input variant="outline" validation="error" message="Required field" />',
    '```',
    '',
    '### Cards',
    '```tsx',
    '// Elevated card',
    '<Card variant="elevated" padding="md">',
    '  <h3>Card Title</h3>',
    '  <p>Content goes here</p>',
    '</Card>',
    '```',
    '',
    '## Layout Patterns',
    '',
    '### Stack',
    'Vertical arrangement with consistent spacing',
    '```tsx',
    '<Stack gap="md">',
    '  <Component1 />',
    '  <Component2 />',
    '</Stack>',
    '```',
    '',
    '### Grid',
    'Responsive grid layout',
    '```tsx',
    '<Grid columns={3} gap="md">',
    '  <Card />',
    '  <Card />',
    '  <Card />',
    '</Grid>',
    '```',
    '',
    '### Flex',
    'Flexible container with alignment',
    '```tsx',
    '<Flex justify="between" align="center">',
    '  <LeftContent />',
    '  <RightContent />',
    '</Flex>',
    '```',
    '',
    '## Best Practices',
    '',
    '1. **Consistency**: Always use designOS tokens for colors, spacing, typography',
    '2. **Accessibility**: Ensure sufficient contrast (WCAG AA minimum)',
    '3. **Responsive**: Design for mobile-first, scale up',
    '4. **Dark Mode**: designOS is dark-mode native',
    '5. **Components**: Prefer designOS components over custom implementations',
    '',
    '## Integration',
    '',
    '### Claude Code Prompts',
    'Use designOS in your prompts:',
    '- "Build with designOS patterns"',
    '- "Use designOS button component"',
    '- "Apply designOS spacing scale"',
    '',
    '### Auto-Detection',
    'designOS activates automatically when:',
    '- Prompt contains "designOS" or "design system"',
    '- Building UI components',
    '- Creating responsive layouts',
    '- Working with themes',
    '',
    '## Version History',
    '',
    '### 1.0 (Current)',
    '- Initial designOS framework',
    '- Core design tokens',
    '- Basic component patterns',
    '- Layout utilities',
    '- Style guide documentation'
  ].join('\n');

  const guidePath = path.join(CLAUDE_DIR, 'DESIGNOS_GUIDE.md');
  return createFile(guidePath, guideLines, 'designOS style guide');
}

// ============================================================================
// STEP 3: CREATE DESIGNOS COMPONENT LIBRARY
// ============================================================================

function createDesigOSComponents() {
  log('Creating designOS component library...', 'info');

  const componentsLines = [
    '/**',
    ' * designOS Component Library',
    ' * Auto-generated for Claude Code integration',
    ' */',
    '',
    'export const designOS = {',
    '  // Design Tokens',
    '  tokens: {',
    '    colors: {',
    "      primary: '#0066FF',",
    "      secondary: '#FF6B00',",
    "      accent: '#00D4FF',",
    "      success: '#00CC66',",
    "      warning: '#FFB020',",
    "      error: '#FF4757',",
    "      background: '#0A0E14',",
    "      surface: '#151A23',",
    "      text: '#E6EDF3',",
    "      muted: '#8B949E'",
    '    },',
    '    spacing: {',
    "      xs: '4px',",
    "      sm: '8px',",
    "      md: '16px',",
    "      lg: '24px',",
    "      xl: '32px',",
    "      xxl: '48px'",
    '    },',
    '    typography: {',
    "      fontFamily: 'Inter, system-ui, sans-serif',",
    "      baseSize: '16px',",
    "      lineHeight: '1.5'",
    '    }',
    '  },',
    '  ',
    '  // Component Factory',
    '  button: (options) => ({',
    "    variant: options.variant || 'primary',",
    "    size: options.size || 'md',",
    "    label: options.label || 'Button',",
    '    styles: {',
    "      padding: options.size === 'sm' ? '8px 16px' : ",
    "               options.size === 'lg' ? '16px 32px' : '12px 24px',",
    "      borderRadius: '6px',",
    "      fontWeight: '600'",
    '    }',
    '  }),',
    '  ',
    '  input: (options) => ({',
    "    variant: options.variant || 'outline',",
    "    placeholder: options.placeholder || '',",
    "    validation: options.validation || null,",
    '    styles: {',
    "      padding: '12px',",
    "      borderRadius: '6px',",
    "      border: '1px solid #30363D'",
    '    }',
    '  }),',
    '  ',
    '  card: (options) => ({',
    "    variant: options.variant || 'elevated',",
    "    padding: options.padding || 'md',",
    '    styles: {',
    "      background: '#151A23',",
    "      borderRadius: '8px',",
    "      padding: options.padding === 'sm' ? '12px' :",
    "               options.padding === 'lg' ? '24px' : '16px'",
    '    }',
    '  })',
    '};',
    '',
    '// Auto-detection keywords',
    'export const DESIGNOS_KEYWORDS = [',
    "  'designOS',",
    "  'design system',",
    "  'design tokens',",
    "  'theme',",
    "  'component library',",
    "  'ui kit',",
    "  'design language',",
    "  'design tokens',",
    "  'figma',",
    "  'design system'",
    '];',
    '',
    '// Component patterns',
    'export const DESIGNOS_PATTERNS = {',
    "  layout: ['stack', 'grid', 'flex', 'cluster'],",
    "  interaction: ['hover', 'focus', 'active', 'disabled'],",
    "  state: ['loading', 'error', 'empty', 'success']",
    '};',
    '',
    '// Validation rules',
    'export const DESIGNOS_RULES = {',
    "  colors: 'Use theme tokens only',",
    "  spacing: '8px base unit',",
    "  typography: 'Inter, system-ui, sans-serif',",
    "  components: 'Use designOS components when available'",
    '};'
  ].join('\n');

  const componentsPath = path.join(DESIGNOS_DIR, 'components.js');
  ensureDirectory(DESIGNOS_DIR);
  return createFile(componentsPath, componentsLines, 'designOS component library');
}

// ============================================================================
// STEP 4: CREATE AUTO-ACTIVATION TRIGGER
// ============================================================================

function createDesigOSActivation() {
  log('Creating designOS auto-activation system...', 'info');

  const activationLines = [
    '/**',
    ' * designOS Auto-Activation Module',
    ' * Detects designOS keywords and activates framework',
    ' */',
    '',
    "const fs = require('fs');",
    "const path = require('path');",
    '',
    "const CLAUDE_DIR = path.join(process.env.HOME, '.claude');",
    '',
    '// Keywords that trigger designOS',
    'const DESIGNOS_TRIGGERS = [',
    "  'designOS',",
    "  'design system',",
    "  'design tokens',",
    "  'theme',",
    "  'component library',",
    "  'ui kit',",
    "  'design language',",
    "  'figma',",
    "  'design system',",
    "  'responsive layout',",
    "  'dark mode',",
    "  'design pattern',",
    "  'design token',",
    "  'design system'",
    '];',
    '',
    '// Check if prompt contains designOS keywords',
    'function shouldActivateDesigOS(prompt) {',
    '  const lowerPrompt = prompt.toLowerCase();',
    '  return DESIGNOS_TRIGGERS.some(keyword =>',
    '    lowerPrompt.includes(keyword.toLowerCase())',
    '  );',
    '}',
    '',
    '// Get designOS configuration',
    'function getDesigOSConfig() {',
    "  const configPath = path.join(CLAUDE_DIR, 'designOS.json');",
    '  if (fs.existsSync(configPath)) {',
    '    return JSON.parse(fs.readFileSync(configPath, \'utf8\'));',
    '  }',
    '  return null;',
    '}',
    '',
    '// Get style guide',
    'function getDesigOSGuide() {',
    "  const guidePath = path.join(CLAUDE_DIR, 'DESIGNOS_GUIDE.md');",
    '  if (fs.existsSync(guidePath)) {',
    '    return fs.readFileSync(guidePath, \'utf8\');',
    '  }',
    '  return null;',
    '}',
    '',
    '// Generate designOS prompt enhancement',
    'function enhancePromptWithDesigOS(prompt) {',
    '  const config = getDesigOSConfig();',
    '  const guide = getDesigOSGuide();',
    '',
    '  if (!config || !guide) {',
    '    return prompt;',
    '  }',
    '',
    '  return [prompt,',
    "    '',",
    "    '---',",
    "    '## designOS Framework Active',",
    "    '',",
    "    '### Design Tokens (Use these exclusively):',",
    '    JSON.stringify(config.theme, null, 2),',
    "    '',",
    "    '### Component Patterns:',",
    "    '- Buttons: primary, secondary, outline, ghost variants',",
    "    '- Inputs: filled, outline, underline variants',",
    "    '- Cards: elevated, outlined, filled variants',",
    "    '- Layout: stack, grid, flex, cluster patterns',",
    "    '',",
    "    '### Rules:',",
    '    JSON.stringify(config.rules, null, 2),',
    "    '',",
    "    '### Reference: DESIGNOS_GUIDE.md for complete patterns'",
    '  ].join(\"\\n\");',
    '}',
    '',
    '// Log activation',
    'function logActivation(prompt) {',
    "  console.log('🔵 designOS: Framework activated');",
    "  console.log('   Keywords detected:', DESIGNOS_TRIGGERS.filter(k =>",
    '    prompt.toLowerCase().includes(k.toLowerCase())',
    "  ).join(', '));",
    '}',
    '',
    'module.exports = {',
    '  shouldActivateDesigOS,',
    '  getDesigOSConfig,',
    '  getDesigOSGuide,',
    '  enhancePromptWithDesigOS,',
    '  logActivation,',
    '  DESIGNOS_TRIGGERS',
    '};'
  ].join('\n');

  const activationPath = path.join(DESIGNOS_DIR, 'activation.js');
  ensureDirectory(DESIGNOS_DIR);
  return createFile(activationPath, activationLines, 'designOS auto-activation system');
}

// ============================================================================
// STEP 5: CREATE INTEGRATION MARKER
// ============================================================================

function createIntegrationMarker() {
  log('Creating designOS integration marker...', 'info');

  const marker = {
    module: 'setup-designOS.js',
    version: '1.0',
    installed: new Date().toISOString(),
    status: 'active',
    features: [
      'Design tokens (colors, spacing, typography)',
      'Component library (button, input, card)',
      'Layout patterns (stack, grid, flex, cluster)',
      'Auto-activation system',
      'Style guide documentation'
    ],
    triggers: [
      'designOS',
      'design system',
      'design tokens',
      'theme',
      'component library',
      'ui kit'
    ]
  };

  const markerPath = path.join(PLUGINS_DIR, 'designOS-installed.json');
  ensureDirectory(PLUGINS_DIR);
  return createFile(markerPath, JSON.stringify(marker, null, 2), 'designOS integration marker');
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main() {
  log('═══════════════════════════════════════════════════════════', 'info');
  log('🔵 designOS INTEGRATION MODULE', 'info');
  log('═══════════════════════════════════════════════════════════', 'info');

  const results = {
    config: createDesigOSConfig(),
    guide: createDesigOSStyleGuide(),
    components: createDesigOSComponents(),
    activation: createDesigOSActivation(),
    marker: createIntegrationMarker()
  };

  const allSuccess = Object.values(results).every(r => r === true);

  log('\n═══════════════════════════════════════════════════════════', 'info');
  log('📊 designOS SETUP SUMMARY', 'info');
  log('═══════════════════════════════════════════════════════════', 'info');

  if (allSuccess) {
    log('✅ designOS integration complete!', 'success');
    log('\n🎯 Features installed:', 'info');
    log('   • Design tokens & theme system', 'info');
    log('   • Component library (button, input, card)', 'info');
    log('   • Layout patterns (stack, grid, flex)', 'info');
    log('   • Auto-activation (designOS keywords)', 'info');
    log('   • Style guide documentation', 'info');
    log('\n💡 Usage: Say "designOS" or "design system" in prompts', 'info');
  } else {
    log('⚠️  Some features failed to install', 'warn');
  }

  log('═══════════════════════════════════════════════════════════', 'info');

  return allSuccess;
}

// Execute
if (require.main === module) {
  main().catch(error => {
    console.error(`Fatal error: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { main };
