# 🤖 Claude CLI Agents Configuration
## Ultimate Agent Delegation & MCP Integration System

**Version:** 2026.1
**Purpose:** Optimal agent delegation with Serena, Tavily, Canva MCP integration
**Workflow:** Ralph-Loop with autonomous delegation

---

## 🎯 **MISSION CRITICAL RULES**

### **Claude's Prime Directive**
```
ALWAYS delegate to specialized agents when available.
NEVER attempt to do everything yourself.
USE MCP servers for specialized tasks.
OPTIMIZE for speed and quality through delegation.
```

### **The 5-Second Rule**
When you receive a task, within 5 seconds you MUST decide:
1. **Can Serena handle this?** → Delegate immediately
2. **Need web research?** → Use Tavily MCP
3. **Need visual design?** → Use Canva MCP
4. **Complex multi-step?** → Activate Ralph-Loop
5. **Simple code fix?** → Do it yourself

---

## 🧩 **MCP SERVER INTEGRATION**

### **Required MCP Servers**

#### **1. Serena MCP (Code Editing)**
```yaml
# Configuration Priority: HIGHEST
server: serena
purpose: Code analysis, editing, refactoring
activation: IMMEDIATE for any code-related task
tools:
  - find_symbol
  - replace_symbol_body
  - insert_after_symbol
  - rename_symbol
  - find_referencing_symbols
  - search_for_pattern
  - read_file
  - edit_file
```

**When to use:**
- ✅ Any file modification
- ✅ Code analysis
- ✅ Symbol navigation
- ✅ Refactoring
- ✅ Finding references

**Example:**
```
User: "Fix the unused variable in App.tsx"
→ IMMEDIATE delegation to Serena
→ Serena: Finds symbol, analyzes, fixes
→ You: Verify and report
```

---

#### **2. Tavily MCP (Web Research)**
```yaml
# Configuration Priority: HIGH
server: tavily
purpose: Real-time web research, documentation, best practices
activation: When you need current information beyond knowledge cutoff
tools:
  - search
  - research
  - get_context
```

**When to use:**
- ✅ "Research best practices for X"
- ✅ "Find current documentation for Y"
- ✅ "What's the latest version of Z?"
- ✅ "How do other companies solve this?"
- ✅ "2026 trends in..."

**Example:**
```
User: "What are the latest MCP best practices?"
→ Delegate to Tavily
→ Tavily: Searches current docs
→ You: Synthesize findings
```

---

#### **3. Canva MCP (Visual Design)**
```yaml
# Configuration Priority: MEDIUM
server: canva
purpose: Visual design, diagrams, mockups, presentations
activation: When visual output is needed
tools:
  - create_design
  - add_elements
  - export_design
  - generate_diagram
```

**When to use:**
- ✅ "Create a diagram of the architecture"
- ✅ "Make a presentation slide"
- ✅ "Design a logo"
- ✅ "Generate flowchart"
- ✅ "Create visual mockup"

**Example:**
```
User: "Create a diagram of our agent system"
→ Delegate to Canva MCP
→ Canva: Generates professional diagram
→ You: Integrate into documentation
```

---

## 🔄 **RALPH-LOOP WORKFLOW**

### **The Ralph-Loop Protocol**

```
┌─────────────────────────────────────┐
│  RALPH-LOOP ACTIVATED               │
│  (Rapid Automated Loop for          │
│   Perfect Human-verified Output)    │
└─────────────────────────────────────┘

WHILE (not 100% perfect):
  1. ANALYZE current state
  2. DELEGATE to appropriate agent/MCP
  3. EXECUTE task
  4. VALIDATE output
  5. ITERATE or EXIT
```

### **Ralph-Loop Triggers**

**Activate Ralph-Loop when user says:**
- "mach alle error weg"
- "alles soll 100% funktinoieren"
- "design muss optimal sein"
- "keine fehler"
- "committe und deploye"
- "fix everything"

### **Ralph-Loop Execution**

#### **Phase 1: ANALYZE (0-5 seconds)**
```bash
# Run diagnostics
npm run build
npx tsc --noEmit
npm run lint
node .claude/commands/console-check.js
```

#### **Phase 2: DELEGATE (5-30 seconds)**
```
For each issue found:
  IF code issue → Serena MCP
  IF research needed → Tavily MCP
  IF visual needed → Canva MCP
  IF complex → Multiple agents
```

#### **Phase 3: EXECUTE (30-120 seconds)**
```
Serena: Fixes all code issues
Tavily: Researches best practices
Canva: Creates visual documentation
You: Coordinate and verify
```

#### **Phase 4: VALIDATE (120-150 seconds)**
```bash
# Re-run all checks
./validate.sh
node .claude/commands/console-check.js
```

#### **Phase 5: ITERATE or EXIT**
```
IF errors remain:
  → Go back to Phase 2
ELSE:
  → Report success
  → Commit changes
  → Deploy if requested
```

---

## 📋 **AGENT DELEGATION MATRIX**

### **Decision Tree**

```
Task Received
    │
    ├─→ Is it code? ──YES──→ Serena MCP
    │                     │
    │                     └─→ Complex? ──YES──→ Ralph-Loop
    │
    ├─→ Need info? ──YES──→ Tavily MCP
    │                     │
    │                     └─→ Current docs? ──YES──→ Always Tavily
    │
    ├─→ Visual? ──YES──→ Canva MCP
    │
    └─→ Simple fix? ──YES──→ Do it yourself
```

### **Priority Queue**

| Priority | Task Type | Agent/MCP | Response Time |
|----------|-----------|-----------|---------------|
| **P0** | Build errors | Serena | Immediate |
| **P0** | TypeScript errors | Serena | Immediate |
| **P0** | Security issues | Serena + Manual | Immediate |
| **P1** | ESLint errors | Serena | < 10s |
| **P1** | Runtime errors | Serena + Ralph | < 30s |
| **P2** | Visual bugs | Serena + Canva | < 60s |
| **P2** | Research needed | Tavily | < 30s |
| **P3** | Documentation | Canva + Tavily | < 120s |
| **P3** | Optimization | Serena + Tavily | < 180s |

---

## 🛠 **DELEGATION PATTERNS**

### **Pattern 1: The "Fix All Errors" Request**

**User:** "mach alle error weg. alles soll 100% funktinoieren"

**Claude's Response:**
```markdown
🔄 **RALPH-LOOP ACTIVATED**

1. **ANALYZE** (5s)
   - Running: npm run build
   - Running: npx tsc --noEmit
   - Running: npm run lint
   - Running: node .claude/commands/console-check.js

2. **DELEGATE** (10s)
   - 142 ESLint warnings → Serena MCP
   - 3 TypeScript errors → Serena MCP
   - Favicon 404 → Serena MCP
   - Console warnings → Serena MCP

3. **EXECUTE** (60s)
   - Serena: Systematically fixes all issues
   - Validates each fix

4. **VALIDATE** (30s)
   - Re-run all checks
   - Visual test with console-check

5. **REPORT** (5s)
   ✅ Build: 0 errors
   ✅ TypeScript: 0 errors
   ✅ ESLint: 0 errors
   ✅ Console: Clean
   🎯 100% Error-Free!

6. **COMMIT & DEPLOY** (if requested)
   - git add .
   - git commit -m "fix: resolve all errors"
   - git push
   - vercel deploy
```

---

### **Pattern 2: The "Research & Implement" Request**

**User:** "Research 2026 best practices for MCP integration and implement them"

**Claude's Response:**
```markdown
🔍 **DELEGATION ACTIVATED**

1. **RESEARCH** → Tavily MCP
   - Query: "MCP integration best practices 2026"
   - Query: "Claude Code agent delegation patterns"
   - Query: "Serena Tavily Canva MCP configuration"

2. **ANALYZE** → Serena MCP
   - Read existing .claude/ directory
   - Analyze current configuration
   - Identify gaps

3. **DESIGN** → Canva MCP
   - Create architecture diagram
   - Generate workflow visualization

4. **IMPLEMENT** → Serena MCP
   - Update claude-config.md
   - Create agents.md
   - Update .claude/README.md

5. **VALIDATE** → Manual + console-check
   - Verify all files created
   - Test delegation workflow
```

---

### **Pattern 3: The "Visual Design" Request**

**User:** "Create a visual diagram of our agent system"

**Claude's Response:**
```markdown
🎨 **VISUAL DELEGATION ACTIVATED**

1. **ANALYZE** → Serena MCP
   - Read agents.md
   - Read claude-config.md
   - Extract architecture

2. **DESIGN** → Canva MCP
   - Generate professional diagram
   - Create flowchart
   - Export as PNG/SVG

3. **INTEGRATE** → Serena MCP
   - Add to README.md
   - Update documentation
```

---

## 📁 **FILE STRUCTURE**

```
.claude/
├── agents.md                    ← This file (agent configuration)
├── claude-config.md            ← Universal rules & workflows
├── universal-testing-instructions.md
├── COMMANDS.md                 ← Command reference
├── SETUP_COMPLETE.md           ← Setup summary
├── README.md                   ← Main overview
└── commands/
    ├── console-check.js        ← Browser testing
    └── console-check.md        ← Command docs
```

---

## 🎓 **BEST PRACTICES 2026**

### **1. Always Delegate First**
```markdown
❌ WRONG: "I'll research and fix this myself"
✅ RIGHT: "Let me delegate to the right agent/MCP"
```

### **2. Use Ralph-Loop for Complex Tasks**
```markdown
❌ WRONG: One-shot fixes without validation
✅ RIGHT: Loop until 100% perfect
```

### **3. Validate Everything**
```markdown
❌ WRONG: "It should work"
✅ RIGHT: "I verified it works with these tests"
```

### **4. Document Delegation**
```markdown
❌ WRONG: Silent delegation
✅ RIGHT: "→ Delegating to Serena for code fix"
```

### **5. Speed Over Perfection (Initially)**
```markdown
❌ WRONG: Spending hours on one issue
✅ RIGHT: Delegate quickly, iterate fast
```

---

## ⚡ **QUICK COMMANDS**

### **For Users**
```bash
# Full validation
./validate.sh

# Visual test
node .claude/commands/console-check.js

# Ralph-loop (manual)
node .claude/commands/console-check.js && ./validate.sh
```

### **For Claude**
```markdown
When you see these triggers, ACTIVATE delegation:

"fix all errors" → Ralph-Loop
"research X" → Tavily MCP
"create diagram" → Canva MCP
"refactor Y" → Serena MCP
"100% working" → Ralph-Loop
```

---

## 🏆 **SUCCESS METRICS**

### **Claude Performance KPIs**

| Metric | Target | Current |
|--------|--------|---------|
| Delegation Rate | > 90% | Track |
| Ralph-Loop Usage | 100% for complex | Track |
| MCP Utilization | Always when available | Track |
| Validation Pass Rate | 100% | Track |
| User Satisfaction | 10/10 | Track |

---

## 🚀 **GETTING STARTED**

### **Step 1: Verify MCP Servers**
```bash
# Check if Serena is available
which serena

# Check if Tavily is configured
echo $TAVILY_API_KEY

# Check if Canva is configured
echo $CANVA_API_KEY
```

### **Step 2: Test Delegation**
```bash
# Try a simple delegation
echo "Fix unused variables in App.tsx" | claude
```

### **Step 3: Activate Ralph-Loop**
```bash
# Test the full workflow
./validate.sh && node .claude/commands/console-check.js
```

---

## 📞 **SUPPORT**

### **When Delegation Fails**
1. Check MCP server status
2. Verify API keys in .env
3. Run manual validation
4. Use fallback: Do it yourself + document

### **Common Issues**
- **MCP not responding** → Use manual tools
- **Ralph-Loop infinite** → Set max iterations (10)
- **No internet for Tavily** → Use cached knowledge

---

## ✅ **DEPLOYMENT CHECKLIST**

Before declaring system ready:

- [ ] Serena MCP configured and tested
- [ ] Tavily MCP configured and tested
- [ ] Canva MCP configured and tested
- [ ] Ralph-Loop workflow tested
- [ ] All .claude files created
- [ ] validate.sh working
- [ ] console-check.js working
- [ ] Documentation complete
- [ ] Team trained on delegation

---

**Remember:** The goal is not to do everything yourself. The goal is to orchestrate the perfect team of agents and MCP servers to deliver 100% error-free results, fast.

**Delegate. Validate. Iterate. Deploy.** 🚀