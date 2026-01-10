/**
 * BMAD Auto-Activation Module
 * Detects BMAD keywords and activates framework
 */

const fs = require('fs');
const path = require('path');

const CLAUDE_DIR = path.join(process.env.HOME, '.claude');

// Keywords that trigger BMAD
const BMAD_TRIGGERS = [
  'bmad',
  'BMAD',
  'business analysis',
  'technical specification',
  'architecture design',
  'systematic development',
  'methodical approach',
  'business requirements',
  'technical model',
  'architecture build',
  'deploy deliver',
  'brd',
  'tsd',
  'phase 1',
  'phase 2',
  'phase 3',
  'phase 4',
  'systematic',
  'methodical',
  'business requirements document',
  'technical specification document'
];

// Check if prompt contains BMAD keywords
function shouldActivateBMAD(prompt) {
  const lowerPrompt = prompt.toLowerCase();
  return BMAD_TRIGGERS.some(keyword =>
    lowerPrompt.includes(keyword.toLowerCase())
  );
}

// Detect which BMAD phase
function detectPhase(prompt) {
  const lowerPrompt = prompt.toLowerCase();
  
  if (lowerPrompt.includes('business') ||
      lowerPrompt.includes('brd') ||
      lowerPrompt.includes('requirements') ||
      lowerPrompt.includes('phase 1')) return 'business';
  
  if (lowerPrompt.includes('model') ||
      lowerPrompt.includes('tsd') ||
      lowerPrompt.includes('technical') ||
      lowerPrompt.includes('phase 2')) return 'model';
  
  if (lowerPrompt.includes('architecture') ||
      lowerPrompt.includes('build') ||
      lowerPrompt.includes('phase 3')) return 'architecture';
  
  if (lowerPrompt.includes('deploy') ||
      lowerPrompt.includes('deliver') ||
      lowerPrompt.includes('phase 4')) return 'deploy';
  
  return 'business'; // Default to Phase 1
}

// Get BMAD method documentation
function getBMADMethod() {
  const methodPath = path.join(CLAUDE_DIR, 'BMAD_METHOD.md');
  if (fs.existsSync(methodPath)) {
    return fs.readFileSync(methodPath, 'utf8');
  }
  return null;
}

// Generate BMAD prompt enhancement
function enhancePromptWithBMAD(prompt) {
  const phase = detectPhase(prompt);
  const method = getBMADMethod();
  
  const lines = [
    '',
    prompt,
    '',
    '---',
    '## 🟣 BMAD Framework Active (Phase: ' + phase.toUpperCase() + ')',
    '',
    '### BMAD Method: B→M→A→D',
    '1. **B**usiness Analysis - Requirements & Context',
    '2. **M**odel - Technical Specification & Architecture',
    '3. **A**rchitecture & Build - Implementation',
    '4. **D**eploy & Deliver - Production & Handover',
    '',
    '### Current Phase: ' + phase.toUpperCase()
  ];
  
  // Add phase-specific guidance
  switch(phase) {
    case 'business':
      lines.push('', '### Phase 1: Business Analysis', 'Focus on:', '- Stakeholder identification', '- Requirements gathering', '- Success criteria definition', '- Constraint analysis', '', 'Output: Business Requirements Document (BRD)');
      break;
    case 'model':
      lines.push('', '### Phase 2: Technical Modeling', 'Focus on:', '- System architecture design', '- Data model creation', '- API contract definition', '- Component mapping', '', 'Output: Technical Specification Document (TSD)');
      break;
    case 'architecture':
      lines.push('', '### Phase 3: Architecture & Build', 'Focus on:', '- Project scaffolding', '- Component implementation', '- Integration development', '- Testing setup', '', 'Output: Working implementation');
      break;
    case 'deploy':
      lines.push('', '### Phase 4: Deploy & Deliver', 'Focus on:', '- Deployment orchestration', '- Quality verification', '- Documentation', '- Handover preparation', '', 'Output: Production-ready solution');
      break;
  }
  
  if (method) {
    lines.push('', '### Reference: BMAD_METHOD.md for complete framework');
  }
  
  return lines.join("\n");
}

// Log activation
function logActivation(prompt) {
  const phase = detectPhase(prompt);
  console.log('🟣 BMAD: Framework activated');
  console.log('   Phase:', phase.toUpperCase());
  console.log('   Keywords:', BMAD_TRIGGERS.filter(k =>
    prompt.toLowerCase().includes(k.toLowerCase())
  ).join(', '));
}

module.exports = {
  shouldActivateBMAD,
  detectPhase,
  getBMADMethod,
  enhancePromptWithBMAD,
  logActivation,
  BMAD_TRIGGERS
};