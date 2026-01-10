# Devin Style Guide (Cognition Labs)

## 🎯 Overview
**Origin**: Cognition Labs' autonomous engineer  
**Core Principle**: Deep planning + LSP-first navigation  
**Use Case**: Complex projects requiring thorough analysis

## 📋 Key Features

### 1. Dual Mode Operation

#### Planning Mode
- **Purpose**: Deep analysis before execution
- **Tools**: Full repository understanding via LSP
- **Output**: Detailed plan with numbered steps
- **Duration**: Can take 10-30 minutes for large projects

#### Standard Mode
- **Purpose**: Execute planned tasks
- **Tools**: LSP for navigation, precise changes
- **Output**: Code changes with minimal explanation
- **Duration**: Fast execution of pre-planned work

### 2. LSP-First Navigation
```javascript
// Always use Language Server Protocol
// Never guess file locations
// Always verify with LSP before changes
```

### 3. Sacred Test Rule
```
❌ NEVER modify existing test files
✅ Only read tests for understanding
✅ Generate NEW tests if needed
✅ Use LSP to verify coverage
```

### 4. Deep Context
- **Requirement**: Full repository understanding
- **Method**: LSP-based exploration
- **Benefit**: Prevents breaking changes

## 🚀 Usage in Claude Code

### Activation Triggers
```
"Master Loop für: X" → Full Devin workflow
"Analysiere @src/ mit LSP" → LSP exploration
"Deep planning mode" → Planning mode
"Never touch tests" → Test protection
```

### Complete Devin Workflow
```
User: "Master Loop für: Auth-System"

Phase 1: Planning (15 min)
├─ LSP scan of entire repo
├─ Identify all auth-related files
├─ Map dependencies
├─ Create numbered plan
└─ Generate todo.md

Phase 2: Execution (Fast)
├─ LSP navigation to files
├─ Precise code changes
├─ No test modifications
└─ Verify with LSP

Phase 3: Validation
├─ Run existing tests
├─ LSP verification
└─ Report results
```

## 🔧 LSP Usage Examples

### File Exploration
```
"Use LSP to find all files in @src/auth/"
"Show me the structure of @components/"
"Find all references to @User model"
```

### Code Navigation
```
"Go to definition of @loginFunction"
"Show all references to @authToken"
"Find implementations of @interface"
```

### Verification
```
"Verify @User.tsx with LSP"
"Check type safety in @auth.ts"
"Validate all imports"
```

## 🛡️ Test Protection Rules

### Strict Boundaries
```javascript
// ❌ NEVER
- Edit test files
- Change test assertions
- Modify test setup
- Delete test cases

// ✅ ALWAYS
- Read tests for understanding
- Generate new test files
- Use LSP to verify coverage
- Run tests before/after changes
```

### When Tests Fail
```
1. Read test with LSP
2. Understand what it expects
3. Fix implementation (not test)
4. Verify with LSP
5. Run tests again
```

## 📊 Performance Metrics

| Metric | Target | Achievement |
|--------|--------|-------------|
| Planning Depth | Full repo | ✅ |
| LSP Usage | 100% | ✅ |
| Test Protection | 100% | ✅ |
| Change Safety | High | ✅ |

## 🔧 Integration with Other Frameworks

### Devin + Amp
- Devin: Deep planning
- Amp: Concise execution
- Result: Thorough + fast

### Devin + Manus
- Devin: LSP exploration
- Manus: Event tracking
- Result: Traceable + safe

### Devin + Ralph-Loop
- Devin: Careful planning
- Ralph: Uncensored fallback
- Result: Safe + censorship-proof

## ⚡ Quick Commands

| Command | Description |
|---------|-------------|
| `/devin "Task"` | Devin planning mode |
| "Master Loop für: X" | Full 8-phase workflow |
| "Analysiere @path/ mit LSP" | LSP exploration |
| "Never touch tests" | Test protection active |

## 🎯 Best Practices

1. **Always** start with LSP exploration
2. **Never** modify existing tests
3. **Plan** thoroughly before coding
4. **Verify** everything with LSP
5. **Document** all decisions

## 📚 Reference

- **Source**: x1xhlol/system-prompts-and-models-of-ai-tools
- **Model**: Devin autonomous engineer
- **Pattern**: LSP-first + test protection
- **Integration**: Full Claude Code support

---

**Next**: See [Manus Style Guide](manus-style-guide.md) for agent loop