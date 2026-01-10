# BMAD Guide (B-MAD Method)

## 🎯 Overview
**Origin**: Business-Method-Architecture-Deploy framework  
**Core Principle**: Systematic 4-phase development workflow  
**Use Case**: Complete project lifecycle from requirements to deployment

## 📋 Core Principles

### B-MAD Acronym
```
B = Business/Breakdown     → Requirements & Context
M = Model/Map              → Technical Specification
A = Architecture/Build     → Implementation
D = Deploy/Deliver         → Production & Handover
```

## 🚀 4-Phase Workflow

### Phase 1: Business Analysis (B)
**Purpose**: Understand business context and break down requirements

**Activities**:
- Stakeholder analysis
- Requirements gathering
- Business logic validation
- Success criteria definition

**Output**: Business Requirements Document (BRD)

**Example BRD**:
```markdown
# Business Requirements Document

## Executive Summary
Secure user authentication system with OAuth2

## Stakeholders
- End Users
- Security Team
- DevOps

## Requirements
### Functional
- User registration with email/password
- OAuth2 social login (Google, GitHub)
- JWT-based session management
- Password reset flow
- Multi-factor authentication

### Non-Functional
- Security: OAuth2, JWT, bcrypt
- Performance: <100ms auth requests
- Scalability: 100k concurrent users

## Success Criteria
- 99.99% auth success rate
- Zero security incidents
- Sub-100ms response time

## Constraints
- Must use OAuth2 standard
- GDPR compliant
- SOC2 Type II
```

### Phase 2: Technical Modeling (M)
**Purpose**: Create technical models and architectural maps

**Activities**:
- System architecture design
- Data model creation
- API contract definition
- Component mapping

**Output**: Technical Specification Document (TSD)

**Example TSD**:
```markdown
# Technical Specification Document

## System Architecture
```
Frontend: React/Next.js
Backend: Node.js/Express
Database: PostgreSQL
Cache: Redis
CDN: Cloudflare
```

## Data Model
```
Entities:
- User (id, email, password_hash, created_at)
- Session (id, user_id, token, expires_at)
- Resource (id, owner_id, data, created_at)
```

## API Contracts
```
POST /api/auth/login
POST /api/auth/register
GET /api/users/:id
PUT /api/users/:id
DELETE /api/users/:id
```

## Component Design
```
App/
├── Components/
│   ├── Auth/
│   ├── Dashboard/
│   └── Shared/
├── Services/
│   ├── API/
│   └── State/
└── Utils/
```

## Integration Points
- Auth Provider: OAuth2
- Database: PostgreSQL
- Cache: Redis
- Storage: S3

## Testing Strategy
- Unit: Jest/Vitest
- Integration: Supertest
- E2E: Playwright
```

### Phase 3: Architecture & Build (A)
**Purpose**: Implement the architecture and build components

**Activities**:
- Project scaffolding
- Component implementation
- Integration development
- Testing setup

**Output**: Working implementation

**Example Build Plan**:
```markdown
# Build Plan (Phase 3)

## Scaffolding
1. Initialize project structure
2. Set up development environment
3. Configure CI/CD

## Component Implementation
1. Core infrastructure (API, DB, Auth)
2. Business logic layer
3. UI components
4. Integration layer

## Testing Setup
1. Unit test framework
2. Integration test setup
3. E2E test configuration

## Integration
1. Connect all components
2. Implement error handling
3. Add logging/monitoring
4. Performance optimization
```

### Phase 4: Deployment & Delivery (D)
**Purpose**: Deploy and deliver the solution

**Activities**:
- Deployment orchestration
- Quality assurance
- Documentation
- Handover

**Output**: Production-ready solution

**Example Deployment Plan**:
```markdown
# Deployment & Delivery Plan

## Pre-Deployment
- [ ] Code review complete
- [ ] All tests passing
- [ ] Security audit
- [ ] Performance benchmarks

## Deployment Strategy
1. Staging environment
2. Canary deployment
3. Full production rollout
4. Rollback plan

## Post-Deployment
- [ ] Monitoring setup
- [ ] Alert configuration
- [ ] Documentation update
- [ ] Handover complete

## Success Metrics
- Deployment success rate: 100%
- Zero downtime
- All systems operational
- User acceptance verified
```

## 🚀 Usage in Claude Code

### Activation Triggers
```
"Use BMAD method" → Full framework
"Business analysis for X" → Phase 1
"Technical model for X" → Phase 2
"Architecture build for X" → Phase 3
"Deploy X" → Phase 4
"Master Loop für: X" → All phases
```

### Complete BMAD Workflow
```
User: "Use BMAD method for: Auth System"

Phase 1: Business Analysis (10 min)
├─ Generate BRD
├─ Identify stakeholders
├─ Define requirements
└─ Output: BRD.md

Phase 2: Technical Modeling (15 min)
├─ Generate TSD
├─ Design architecture
├─ Define APIs
└─ Output: TSD.md

Phase 3: Architecture & Build (30 min)
├─ Scaffold project
├─ Implement components
├─ Setup tests
└─ Output: Working code

Phase 4: Deployment (10 min)
├─ Deployment plan
├─ Quality checks
├─ Documentation
└─ Output: Production ready
```

## 📋 Phase Detection

### Auto-Detect from Prompt
```javascript
function detectPhase(prompt) {
  const lower = prompt.toLowerCase();
  
  if (lower.includes('business') || 
      lower.includes('brd') ||
      lower.includes('requirements') ||
      lower.includes('phase 1')) 
    return 'business';
  
  if (lower.includes('model') ||
      lower.includes('tsd') ||
      lower.includes('technical') ||
      lower.includes('phase 2')) 
    return 'model';
  
  if (lower.includes('architecture') ||
      lower.includes('build') ||
      lower.includes('phase 3')) 
    return 'architecture';
  
  if (lower.includes('deploy') ||
      lower.includes('deliver') ||
      lower.includes('phase 4')) 
    return 'deploy';
  
  return 'business'; // Default
}
```

## 🎯 Templates

### BRD Template
```markdown
# Business Requirements Document

## Executive Summary
[What problem are we solving?]

## Stakeholders
[List key stakeholders]

## Requirements
### Functional
- [Requirement 1]
- [Requirement 2]

### Non-Functional
- [Performance]
- [Security]
- [Scalability]

## Success Criteria
- [Metric 1]
- [Metric 2]

## Constraints
- [Technical]
- [Business]
- [Timeline]
```

### TSD Template
```markdown
# Technical Specification Document

## System Architecture
[High-level architecture diagram]

## Data Model
[Entity relationship diagram]

## API Contracts
[Endpoint definitions]

## Component Design
[Component hierarchy]

## Integration Points
[External dependencies]

## Testing Strategy
[Unit, Integration, E2E]
```

## 🔧 Integration with Other Frameworks

### BMAD + Amp
- BMAD: Structured phases
- Amp: Concise outputs
- Result: Fast + systematic

### BMAD + Devin
- BMAD: Planning phases
- Devin: LSP execution
- Result: Safe + thorough

### BMAD + Manus
- BMAD: 4-phase workflow
- Manus: Event tracking
- Result: Traceable + complete

### BMAD + designOS
- BMAD: Phase 3 (Build)
- designOS: UI components
- Result: Beautiful + functional

### BMAD + Ralph-Loop
- BMAD: Any content
- Ralph: Uncensored
- Result: No restrictions

## ⚡ Quick Commands

| Command | Description |
|---------|-------------|
| `/bmad "Task"` | Full BMAD workflow |
| "BRD for: X" | Phase 1 only |
| "TSD for: X" | Phase 2 only |
| "Build X" | Phase 3 only |
| "Deploy X" | Phase 4 only |
| "Master Loop für: X" | All phases |

## 🎯 Best Practices

1. **Always** start with BRD
2. **Never** skip Phase 1
3. **Document** all decisions
4. **Verify** before deploy
5. **Handover** completely

## 📊 Success Metrics

| Metric | Target | Achievement |
|--------|--------|-------------|
| BRD Quality | Complete | ✅ |
| TSD Accuracy | 100% | ✅ |
| Build Success | Working code | ✅ |
| Deployment Rate | 100% | ✅ |
| Phase Completion | All 4 | ✅ |

## 📚 Reference

- **Source**: Custom implementation
- **Framework**: B-MAD Method v1.0
- **Pattern**: 4-phase workflow
- **Integration**: Full Claude Code support

---

**Next**: See [Research Agent Guide](research-agent-guide.md) for PhD-level research