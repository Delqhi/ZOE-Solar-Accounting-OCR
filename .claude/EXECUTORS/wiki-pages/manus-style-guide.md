# Manus Style Guide (Manus AI)

## 🎯 Overview
**Origin**: Manus AI multi-module agent  
**Core Principle**: Event-driven execution with persistent knowledge  
**Use Case**: Long-running projects requiring context persistence

## 📋 Key Features

### 1. Agent Loop Architecture
```javascript
// Event-driven execution flow
User Input → Planner → Knowledge → Execution → Feedback → Next Step
```

### 2. Planner Module
- **Format**: Numbered pseudocode steps
- **Output**: Structured execution plan
- **Integration**: Updates todo.md automatically
- **Benefit**: Clear progress tracking

### 3. Knowledge Module
- **Purpose**: Persistent context across sessions
- **Storage**: `.claude/PROJECT_KNOWLEDGE.md`
- **Content**: Decisions, patterns, learnings
- **Benefit**: Never loses context

### 4. Data APIs
- **Purpose**: Structured data processing
- **Format**: JSON/CSV/Structured outputs
- **Integration**: Automatic logging
- **Benefit**: Traceable results

### 5. Todo.md Central Hub
- **Location**: `.claude/todo.md`
- **Format**: Checklist with priorities
- **Updates**: After every action
- **Benefit**: Always know what's next

## 🚀 Usage in Claude Code

### Activation Triggers
```
"Entwickle X mit Agent-Loop" → Manus mode
"Master Loop für: X" → Full workflow
"Use todo.md tracking" → Task management
"Update knowledge module" → Context save
```

### Complete Manus Workflow
```
User: "Entwickle Dashboard mit Agent-Loop"

Step 1: Planner Module
├─ Create numbered pseudocode
├─ Generate todo.md
├─ Update knowledge module
└─ Event: "Planning complete"

Step 2: Execution Loop
├─ Read todo.md
├─ Execute step 1
├─ Update todo.md
├─ Save to knowledge
├─ Event: "Step 1 complete"
└─ Continue to step 2

Step 3: Knowledge Persistence
├─ All decisions logged
├─ Patterns identified
├─ Learnings stored
└─ Available for next session
```

## 📋 Todo.md Format

### Structure
```markdown
# Project: Dashboard

## Priority 1 (Critical)
- [ ] Setup auth system
  - [ ] Create User model
  - [ ] Implement login
  - [ ] Add OAuth2

## Priority 2 (Important)
- [ ] Build UI components
  - [ ] Dashboard layout
  - [ ] Chart components
  - [ ] Data tables

## Priority 3 (Nice to have)
- [ ] Add animations
- [ ] Optimize performance
```

### Auto-Updates
```
After every action:
✓ Step completed → Update todo.md
✗ Step failed → Log in knowledge
→ Next step → Prepare execution
```

## 🧠 Knowledge Module

### What to Store
```markdown
# Project Knowledge: Dashboard

## Decisions Made
- 2026-01-08: Use React + Tailwind (Reason: Fast dev)
- 2026-01-08: PostgreSQL for DB (Reason: Scale)

## Patterns Found
- Auth: Use JWT + OAuth2
- UI: Component library approach
- State: Redux for complex state

## Learnings
- Avoid nested ternaries (Amp style)
- Use LSP for navigation (Devin style)
- Keep files <200 lines (SRP)
```

### When to Update
- After major decisions
- When patterns emerge
- After solving problems
- Before session ends

## 🔧 Data APIs

### Structured Processing
```javascript
// Input: Raw data
// Process: Via Data API
// Output: Structured result
// Log: Automatic
```

### Examples
```
User: "Process this log file"
→ Data API extracts structure
→ Creates JSON output
→ Logs to knowledge
→ Returns structured data
```

## 📊 Performance Metrics

| Metric | Target | Achievement |
|--------|--------|-------------|
| Todo Updates | 100% | ✅ |
| Knowledge Sync | Every session | ✅ |
| Event Logging | Every action | ✅ |
| Context Loss | 0% | ✅ |

## 🔧 Integration with Other Frameworks

### Manus + Amp
- Manus: Event tracking
- Amp: Concise outputs
- Result: Clean + traceable

### Manus + Devin
- Manus: Knowledge persistence
- Devin: LSP exploration
- Result: Context-aware + safe

### Manus + Ralph-Loop
- Manus: Event logging
- Ralph: Uncensored fallback
- Result: Complete audit trail

## ⚡ Quick Commands

| Command | Description |
|---------|-------------|
| `/sisyphus "Task"` | Manus agent loop |
| "Update knowledge module" | Save context |
| "Show todo.md" | View tasks |
| "Master Loop für: X" | Full workflow |

## 🎯 Best Practices

1. **Always** maintain todo.md
2. **Update** knowledge module frequently
3. **Log** all events
4. **Never** lose context
5. **Plan** before executing

## 📚 Reference

- **Source**: x1xhlol/system-prompts-and-models-of-ai-tools
- **Model**: Manus AI multi-module agent
- **Pattern**: Event-driven + knowledge persistence
- **Integration**: Full Claude Code support

---

**Next**: See [Cursor Style Guide](cursor-style-guide.md) for IDE integration