/**
 * BMAD Phase Executors
 * Systematic execution of B-MAD phases
 */

const fs = require('fs');
const path = require('path');

const CLAUDE_DIR = path.join(process.env.HOME, '.claude');

// Phase 1: Business Analysis
function generateBRD(requirements) {
  const lines = [
    '# Business Requirements Document',
    '',
    '## Executive Summary',
    requirements.summary || 'Auto-generated from requirements',
    '',
    '## Stakeholders',
  ];
  if (requirements.stakeholders) {
    lines.push(...requirements.stakeholders.map(s => "- " + s));
  } else {
    lines.push('- Primary User', '- Development Team');
  }
  lines.push('', '## Requirements', '### Functional');
  if (requirements.functional) {
    lines.push(...requirements.functional.map(r => "- " + r));
  } else {
    lines.push('- User authentication', '- Data persistence', '- API integration');
  }
  lines.push('', '### Non-Functional');
  if (requirements.nonFunctional) {
    lines.push(...requirements.nonFunctional.map(r => "- " + r));
  } else {
    lines.push('- Performance: <200ms', '- Security: OAuth2', '- Scalability: 10k users');
  }
  lines.push('', '## Success Criteria');
  if (requirements.successCriteria) {
    lines.push(...requirements.successCriteria.map(c => "- " + c));
  } else {
    lines.push('- 99.9% uptime', '- <5% error rate', '- User satisfaction > 4.5/5');
  }
  lines.push('', '## Constraints');
  if (requirements.constraints) {
    lines.push(...requirements.constraints.map(c => "- " + c));
  } else {
    lines.push('- Budget: Standard', '- Timeline: Agile', '- Tech Stack: Modern');
  }
  return lines.join("\n");
}

// Phase 2: Technical Modeling
function generateTSD(brd) {
  return [
    '# Technical Specification Document',
    '',
    '## System Architecture',
    '```',
    '[High-level architecture]',
    '- Frontend: React/Next.js',
    '- Backend: Node.js/Express',
    '- Database: PostgreSQL',
    '- Cache: Redis',
    '- CDN: Cloudflare',
    '```',
    '',
    '## Data Model',
    '```',
    'Entities:',
    '- User (id, email, password_hash, created_at)',
    '- Session (id, user_id, token, expires_at)',
    '- Resource (id, owner_id, data, created_at)',
    '```',
    '',
    '## API Contracts',
    '```',
    'POST /api/auth/login',
    'POST /api/auth/register',
    'GET /api/users/:id',
    'PUT /api/users/:id',
    'DELETE /api/users/:id',
    '```',
    '',
    '## Component Design',
    '```',
    'App/',
    '├── Components/',
    '│   ├── Auth/',
    '│   ├── Dashboard/',
    '│   └── Shared/',
    '├── Services/',
    '│   ├── API/',
    '│   └── State/',
    '└── Utils/',
    '```',
    '',
    '## Integration Points',
    '- Auth Provider: OAuth2',
    '- Database: PostgreSQL',
    '- Cache: Redis',
    '- Storage: S3',
    '',
    '## Testing Strategy',
    '- Unit: Jest/Vitest',
    '- Integration: Supertest',
    '- E2E: Playwright'
  ].join("\n");
}

// Phase 3: Architecture & Build
function generateBuildPlan(tsd) {
  return [
    '# Build Plan (Phase 3)',
    '',
    '## Scaffolding',
    '1. Initialize project structure',
    '2. Set up development environment',
    '3. Configure CI/CD',
    '',
    '## Component Implementation',
    '1. Core infrastructure (API, DB, Auth)',
    '2. Business logic layer',
    '3. UI components',
    '4. Integration layer',
    '',
    '## Testing Setup',
    '1. Unit test framework',
    '2. Integration test setup',
    '3. E2E test configuration',
    '',
    '## Integration',
    '1. Connect all components',
    '2. Implement error handling',
    '3. Add logging/monitoring',
    '4. Performance optimization'
  ].join("\n");
}

// Phase 4: Deployment & Delivery
function generateDeploymentPlan(buildOutput) {
  return [
    '# Deployment & Delivery Plan',
    '',
    '## Pre-Deployment',
    '- [ ] Code review complete',
    '- [ ] All tests passing',
    '- [ ] Security audit',
    '- [ ] Performance benchmarks',
    '',
    '## Deployment Strategy',
    '1. Staging environment',
    '2. Canary deployment',
    '3. Full production rollout',
    '4. Rollback plan',
    '',
    '## Post-Deployment',
    '- [ ] Monitoring setup',
    '- [ ] Alert configuration',
    '- [ ] Documentation update',
    '- [ ] Handover complete',
    '',
    '## Success Metrics',
    '- Deployment success rate: 100%',
    '- Zero downtime',
    '- All systems operational',
    '- User acceptance verified'
  ].join("\n");
}

// BMAD Orchestrator
function executeBMADPhase(phase, input) {
  switch(phase) {
    case 'business':
    case 'brd':
      return generateBRD(input);
    case 'model':
    case 'tsd':
      return generateTSD(input);
    case 'architecture':
    case 'build':
      return generateBuildPlan(input);
    case 'deploy':
    case 'deliver':
      return generateDeploymentPlan(input);
    default:
      return [
        '# BMAD Phase: ' + phase,
        '',
        'Unknown phase. Available phases:',
        '- business/brd: Business Requirements Document',
        '- model/tsd: Technical Specification Document',
        '- architecture/build: Implementation plan',
        '- deploy/deliver: Deployment plan'
      ].join("\n");
  }
}

// Auto-detection
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
  'phase 4'
];

function shouldActivateBMAD(prompt) {
  const lowerPrompt = prompt.toLowerCase();
  return BMAD_TRIGGERS.some(keyword =>
    lowerPrompt.includes(keyword.toLowerCase())
  );
}

function detectBMADPhase(prompt) {
  const lowerPrompt = prompt.toLowerCase();
  
  if (lowerPrompt.includes('business') || lowerPrompt.includes('brd') ||
      lowerPrompt.includes('requirements')) return 'business';
  if (lowerPrompt.includes('model') || lowerPrompt.includes('tsd') ||
      lowerPrompt.includes('technical')) return 'model';
  if (lowerPrompt.includes('architecture') || lowerPrompt.includes('build') ||
      lowerPrompt.includes('phase 3')) return 'architecture';
  if (lowerPrompt.includes('deploy') || lowerPrompt.includes('deliver') ||
      lowerPrompt.includes('phase 4')) return 'deploy';
  
  return 'business'; // Default
}

function enhancePromptWithBMAD(prompt) {
  const phase = detectBMADPhase(prompt);
  
  return [
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
  ].join("\n");
}

module.exports = {
  executeBMADPhase,
  shouldActivateBMAD,
  detectBMADPhase,
  enhancePromptWithBMAD,
  BMAD_TRIGGERS,
  generateBRD,
  generateTSD,
  generateBuildPlan,
  generateDeploymentPlan
};