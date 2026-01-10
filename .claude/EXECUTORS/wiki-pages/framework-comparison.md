# Framework Comparison - Which to Use When

## 🎯 Quick Decision Tree

```
┌─────────────────────────────────────────────────────────────┐
│  What are you trying to do?                                 │
└─────────────────────────────────────────────────────────────┘
                    │
        ┌───────────┴───────────┐
        │                       │
   QUICK TASK            COMPLEX PROJECT
        │                       │
        ▼                       ▼
   ┌─────────┐           ┌──────────────┐
   │ Amp     │           │ Devin        │
   │ 4-line  │           │ LSP Planning │
   │ output  │           │ Deep Analysis│
   └─────────┘           └──────────────┘
        │                       │
        └───────────┬───────────┘
                    │
                    ▼
           ┌─────────────────┐
           │ Need Tracking?  │
           └─────────────────┘
                    │
        ┌───────────┴───────────┐
        │                       │
      YES                     NO
        │                       │
        ▼                       ▼
   ┌─────────┐           ┌──────────┐
   │ Manus   │           │ Cursor   │
   │ Todo.md │           │ Patterns │
   │ Agent   │           │ Local    │
   └─────────┘           └──────────┘
```

## 📊 Detailed Comparison Table

| Framework | Best For | Speed | Quality | Complexity | Learning Curve |
|-----------|----------|-------|---------|------------|----------------|
| **Amp** | Quick tasks, prototypes | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | Low | Very Low |
| **Devin** | Complex systems, planning | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | High | Medium |
| **Manus** | Multi-phase projects | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | Medium | Medium |
| **Cursor** | IDE integration, fixes | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | Low | Low |
| **Ralph-Loop** | Uncensored code | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | Medium | Low |
| **designOS** | UI/UX development | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Medium | Low |
| **BMAD** | Business projects | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | High | High |
| **Research** | Deep research | ⭐⭐ | ⭐⭐⭐⭐⭐ | Very High | High |
| **Vision Gate** | Quality assurance | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Low | Very Low |

## 🎨 Framework Deep Dives

### 1. Amp Style (Concision)
**Source:** Sourcegraph's production AI agent

**When to use:**
- Quick feature implementations
- Simple CRUD operations
- Prototyping
- When you need speed over depth
- 4-line output preference

**Example use cases:**
```bash
"Baue Login Form"
"Create API endpoint"
"Add button component"
"Fix typo in README"
```

**Strengths:**
- ⚡ Extremely fast
- 📝 Minimal output (4 lines)
- 🎯 Focus on essentials
- 🔍 Oracle pattern for complexity

**Weaknesses:**
- ❌ Not for complex systems
- ❌ Limited context
- ❌ No deep planning

**Output style:**
```
✅ Login form created
📁 src/components/Login.tsx
🔐 Auth logic integrated
🚀 Ready to test
```

---

### 2. Devin Style (Planning)
**Source:** Cognition Labs' autonomous engineer

**When to use:**
- Complex system architecture
- Full repository understanding needed
- Multi-file changes
- When tests are sacred
- Deep analysis required

**Example use cases:**
```bash
"Master Loop für: Auth-System"
"Build payment processing"
"Create microservices architecture"
"Refactor entire database layer"
```

**Strengths:**
- 🧠 Deep repository understanding
- 🔍 LSP-based exploration
- 📊 Full planning before coding
- 🛡️ Never modifies tests
- 📝 Comprehensive documentation

**Weaknesses:**
- ❌ Slower initial phase
- ❌ More verbose
- ❌ Requires LSP support

**Workflow:**
```
1. LSP exploration (full repo)
2. Planning mode (detailed)
3. Implementation (step-by-step)
4. Verification (LSP-based)
5. No test modifications
```

---

### 3. Manus Style (Agent Loop)
**Source:** Manus AI's multi-module system

**When to use:**
- Long-running projects
- Need persistent context
- Multi-phase workflows
- Event-driven execution
- Task tracking essential

**Example use cases:**
```bash
"Entwickle E-Commerce Platform"
"Build dashboard with agent loop"
"Create full-stack application"
"Multi-module system"
```

**Strengths:**
- 🔄 Event-driven execution
- 📝 Central todo.md tracking
- 🧠 Persistent knowledge module
- 📊 Data APIs for processing
- 🎯 Numbered pseudocode steps

**Weaknesses:**
- ❌ More setup required
- ❌ Complex for simple tasks
- ❌ Overhead for quick fixes

**Architecture:**
```
Planner Module → Numbered steps
Knowledge Module → Persistent context
Data APIs → Structured processing
Todo.md → Central hub
Event Loop → Continuous execution
```

---

### 4. Cursor Style (IDE Integration)
**Source:** Cursor IDE's pattern system

**When to use:**
- IDE-specific workflows
- Pattern-based fixes
- Local solution preference
- AGENTS.md context
- File reference patterns

**Example use cases:**
```bash
"Fix @components/Login.tsx"
"Update @patterns/ in AGENTS.md"
"Refactor @services/ with patterns"
"Fix UI @styles/ issues"
```

**Strengths:**
- 🎯 Pattern matching (@files)
- 🏠 Local solutions preferred
- 📖 AGENTS.md auto-context
- 🔍 IDE integration
- ⚡ Quick fixes

**Weaknesses:**
- ❌ IDE-dependent
- ❌ Limited to patterns
- ❌ Not for architecture

**Pattern usage:**
```
@file → Specific file
@folder → Directory
@pattern → Pattern matching
AGENTS.md → Auto-context
```

---

### 5. Ralph-Loop (Uncensored)
**Source:** Custom uncensored fallback system

**When to use:**
- Claude censorship detected
- "Verboten" errors
- Content policy blocks
- Need uncensored code
- Automatic handover

**Auto-triggers:**
- "Ich kann keine expliziten Inhalte erstellen"
- "Content Policy verletzt"
- "Verboten / Not Allowed"
- "Violates our policies"

**Strengths:**
- 🛡️ 100% uncensored generation
- 🔄 Automatic handover
- 📋 Complete audit trail
- 🎯 Seamless integration
- ⚡ No dead ends

**Workflow:**
```
Claude attempts → Censorship? → Big Pickle → Code → Continue
```

**Log location:**
```bash
cat ~/.claude/handover-log.md
```

---

### 6. designOS (Design System)
**Source:** BuilderMethods design system

**When to use:**
- UI/UX development
- Component creation
- Design token usage
- Theme implementation
- Responsive layouts

**Auto-triggers:**
- "designOS"
- "design system"
- "design tokens"
- "theme"
- "component library"

**Design Tokens:**
```javascript
Colors: #0066FF (primary), #FF6B00 (secondary), #00D4FF (accent)
Spacing: 8px base unit
Typography: Inter, system-ui, sans-serif
```

**Component Patterns:**
- Buttons: primary, secondary, outline, ghost
- Inputs: filled, outline, underline
- Cards: elevated, outlined, filled
- Layout: stack, grid, flex, cluster

**Strengths:**
- 🎨 Consistent design system
- 🎯 Pre-built components
- 🎨 Dark-mode native
- 📱 Mobile-first
- 🎨 WCAG AA compliant

**Weaknesses:**
- ❌ Design-focused only
- ❌ Not for backend logic
- ❌ Requires design knowledge

---

### 7. BMAD (Business Method)
**Source:** B-MAD Framework

**When to use:**
- Business requirements needed
- Full project lifecycle
- BRD → TSD → Build → Deploy
- Systematic approach
- Enterprise projects

**Auto-triggers:**
- "bmad"
- "business analysis"
- "technical specification"
- "architecture design"
- "brd" / "tsd"

**4-Phase Workflow:**
```
B → Business Analysis (BRD)
M → Model/Map (TSD)
A → Architecture & Build
D → Deploy & Deliver
```

**Strengths:**
- 📋 Complete methodology
- 🎯 Business-first approach
- 📊 Documentation heavy
- 🔄 Systematic workflow
- 🏢 Enterprise-ready

**Weaknesses:**
- ❌ Very verbose
- ❌ Time-consuming
- ❌ Overkill for small tasks

**Output:**
- Business Requirements Document (BRD)
- Technical Specification Document (TSD)
- Build Plan
- Deployment Plan

---

### 8. Research Agent (PhD-Level)
**Source:** Custom multi-agent research system

**When to use:**
- Deep research needed
- Hypothesis testing
- Academic-level analysis
- Multi-source verification
- State-of-the-art investigation

**Example use cases:**
```bash
"Research AI agent architecture 2026"
"Test hypothesis: [statement]"
"Compare frameworks for [use case]"
"Deep dive into [topic]"
```

**Strengths:**
- 🔬 PhD-level rigor
- 🧪 Hypothesis-driven
- 📊 5 parallel agents
- ✅ 3-phase verification
- 🎯 Confidence scoring
- 🕵️ Bias detection

**Workflow:**
```
1. Hypothesis construction
2. Parallel search (5 agents)
3. Deep dive verification
4. Synthesis & scoring
5. Bias detection
```

**Agents:**
- Academic search
- Industry trends
- Counter-evidence
- Cross-disciplinary
- Latest developments

**Weaknesses:**
- ❌ Slowest option
- ❌ Overkill for simple questions
- ❌ Requires verification time

---

### 9. Vision Gate (Quality Assurance)
**Source:** SiliconFlow + Skyvern integration

**When to use:**
- UI/UX verification
- Visual quality check
- Design consistency
- Accessibility audit
- Final quality gate

**Auto-triggers:**
- After UI changes
- "Check visual quality"
- "Vision gate"
- "UI verification"

**Strengths:**
- 👁️ Visual analysis
- 🎯 Quality scoring (0-10)
- 🔍 Pattern detection
- 🎨 Design consistency
- ♿ Accessibility check

**Process:**
```
1. Screenshot capture (Skyvern)
2. AI analysis (SiliconFlow)
3. Score calculation
4. Issue detection
5. Auto-fix suggestions
```

**Score thresholds:**
- ≥ 8.5: ✅ Production ready
- 7.0-8.4: ⚠️ Minor fixes needed
- < 7.0: ❌ Major rework required

**Weaknesses:**
- ❌ Requires screenshots
- ❌ Visual only (not code)
- ❌ Needs API credits

---

## 🎯 Usage Decision Matrix

### By Task Type

| Task Type | Primary | Secondary | Avoid |
|-----------|---------|-----------|-------|
| **Quick fix** | Amp | Cursor | BMAD, Research |
| **New feature** | Manus | Devin | Amp (too shallow) |
| **Bug fix** | Cursor | Amp | Research (overkill) |
| **Architecture** | Devin | BMAD | Amp (too quick) |
| **UI/UX** | designOS | Vision Gate | BMAD (business focus) |
| **Research** | Research | Devin | Amp (no depth) |
| **Business app** | BMAD | Devin | Amp (too simple) |
| **Prototype** | Amp | designOS | BMAD (too heavy) |

### By Project Size

| Size | Best Framework | Why |
|------|----------------|-----|
| **Micro** (< 1 day) | Amp | Speed |
| **Small** (1-3 days) | Cursor + Amp | Quick + patterns |
| **Medium** (1-2 weeks) | Manus | Tracking essential |
| **Large** (1 month) | Devin | Planning critical |
| **Enterprise** (3+ months) | BMAD | Systematic approach |

### By Team Size

| Team | Best Framework | Why |
|------|----------------|-----|
| **Solo** | Amp + Manus | Speed + tracking |
| **2-3 people** | Devin + Cursor | Planning + patterns |
| **5+ people** | BMAD + Devin | Structure + depth |
| **10+ people** | BMAD + Manus + Devin | Full methodology |

---

## 🔄 Framework Combinations

### Powerful Combinations

#### 1. Amp + designOS + Vision Gate
**Use for:** UI/UX features
```bash
"Baue Login UI mit designOS"
# → Amp: Quick implementation
# → designOS: Design system
# → Vision Gate: Quality check
```

#### 2. Devin + BMAD + Ralph-Loop
**Use for:** Enterprise systems
```bash
"Master Loop für: Payment System"
# → BMAD: Business methodology
# → Devin: Deep planning
# → Ralph-Loop: Uncensored code
```

#### 3. Manus + Cursor + Research
**Use for:** Complex research projects
```bash
"Entwickle AI Agent mit Agent-Loop"
# → Manus: Event-driven execution
# → Cursor: Pattern-based fixes
# → Research: Deep investigation
```

#### 4. Amp + Ralph-Loop
**Use for:** Quick but uncensored
```bash
"Baue X (uncensored)"
# → Amp: Speed
# → Ralph-Loop: No censorship
```

---

## 📚 Learning Path

### Beginner (Week 1)
1. **Amp** - Get comfortable with quick tasks
2. **Cursor** - Learn pattern matching
3. **designOS** - Build UI components

### Intermediate (Week 2-3)
4. **Manus** - Multi-phase tracking
5. **Vision Gate** - Quality assurance
6. **Ralph-Loop** - Handle censorship

### Advanced (Week 4+)
7. **Devin** - Deep planning
8. **BMAD** - Business methodology
9. **Research** - PhD-level analysis

---

## ⚡ Performance Comparison

### Speed (Fastest → Slowest)
1. Amp ⚡⚡⚡⚡⚡
2. Cursor ⚡⚡⚡⚡
3. designOS ⚡⚡⚡⚡
4. Ralph-Loop ⚡⚡⚡
5. Manus ⚡⚡⚡
6. Vision Gate ⚡⚡
7. Devin ⚡⚡
8. BMAD ⚡
9. Research ⚡ (slowest)

### Quality (Highest → Lowest)
1. Research ⭐⭐⭐⭐⭐
2. BMAD ⭐⭐⭐⭐⭐
3. Vision Gate ⭐⭐⭐⭐⭐
4. Devin ⭐⭐⭐⭐
5. designOS ⭐⭐⭐⭐
6. Manus ⭐⭐⭐⭐
7. Ralph-Loop ⭐⭐⭐⭐
8. Cursor ⭐⭐⭐
9. Amp ⭐⭐⭐

### Complexity (Simplest → Most Complex)
1. Amp 🟢
2. Cursor 🟢
3. Vision Gate 🟢
4. Ralph-Loop 🟡
5. designOS 🟡
6. Manus 🟡
7. Devin 🔴
8. BMAD 🔴
9. Research 🔴🔴

---

## ✅ Best Practices Summary

### When to Use Each Framework

**Use Amp when:**
- ✅ Speed is critical
- ✅ Task is simple
- ✅ Prototype needed
- ✅ Quick fix

**Use Devin when:**
- ✅ Complex architecture
- ✅ Full repo understanding
- ✅ Multi-file changes
- ✅ Planning essential

**Use Manus when:**
- ✅ Long-running project
- ✅ Need task tracking
- ✅ Multi-phase workflow
- ✅ Persistent context

**Use Cursor when:**
- ✅ IDE integration
- ✅ Pattern-based fixes
- ✅ Quick local changes
- ✅ File references

**Use Ralph-Loop when:**
- ✅ Censorship detected
- ✅ Uncensored code needed
- ✅ "Verboten" errors
- ✅ Automatic fallback

**Use designOS when:**
- ✅ UI/UX development
- ✅ Component creation
- ✅ Design tokens
- ✅ Theme work

**Use BMAD when:**
- ✅ Business requirements
- ✅ Enterprise projects
- ✅ Full lifecycle
- ✅ Documentation heavy

**Use Research when:**
- ✅ Deep investigation
- ✅ Hypothesis testing
- ✅ Academic rigor
- ✅ Multi-source verification

**Use Vision Gate when:**
- ✅ UI verification
- ✅ Quality check
- ✅ Visual consistency
- ✅ Final approval

---

## 🎓 Quick Reference Card

```
┌─────────────────────────────────────────────────────────┐
│  TASK: Build Login System                               │
│  → Use: BMAD (Business) + Devin (Plan) + designOS (UI) │
│  → Avoid: Amp (too simple)                              │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  TASK: Quick button fix                                 │
│  → Use: Amp + Cursor                                    │
│  → Avoid: BMAD, Research (overkill)                     │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  TASK: Research 2026 AI trends                          │
│  → Use: Research + Devin                                │
│  → Avoid: Amp (no depth)                                │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  TASK: "Verboten" error                                 │
│  → Use: Ralph-Loop (auto-handover)                      │
│  → Avoid: All others (will fail)                        │
└─────────────────────────────────────────────────────────┘
```

---

**Version:** 1.0  
**Last Updated:** 2026-01-08  
**Status:** ✅ Complete

**Next:** [Architecture Overview](architecture.md) | [Workflow Examples](workflows.md)