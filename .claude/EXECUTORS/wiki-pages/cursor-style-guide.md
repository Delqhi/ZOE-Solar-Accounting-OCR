# Cursor Style Guide (Cursor IDE)

## 🎯 Overview
**Origin**: Cursor IDE integration patterns  
**Core Principle**: AGENTS.md auto-context + pattern matching  
**Use Case**: IDE-based development with local solutions

## 📋 Key Features

### 1. AGENTS.md Auto-Context
```markdown
# AGENTS.md (Auto-generated)
## Repository Knowledge
- Tech stack: React + TypeScript
- Architecture: Monorepo
- Patterns: Component library
- Rules: Keep files <200 lines
```

### 2. Pattern Matching
- **Method**: @file and @folder references
- **Benefit**: Fast context injection
- **Integration**: Automatic discovery
- **Usage**: `@components/Login.tsx`

### 3. Local Solutions Preference
```
Priority Order:
1. Local fix (same repo)
2. Nearby solution (monorepo)
3. External library
4. Custom implementation
```

### 4. Context Window Maximization
- **Goal**: Inject all relevant context
- **Method**: Auto-discover related files
- **Benefit**: Better suggestions
- **Result**: Higher accuracy

## 🚀 Usage in Claude Code

### Activation Triggers
```
"Fix @components/ Pattern-Fehler" → Pattern matching
"Use AGENTS.md context" → Auto-context
"Local solution preferred" → Local first
"@file references" → Pattern matching
```

### Complete Cursor Workflow
```
User: "Fix @components/Login.tsx"

Step 1: Context Injection
├─ Read AGENTS.md
├─ Scan @components/ directory
├─ Find related files
├─ Build context window
└─ Event: "Context ready"

Step 2: Pattern Matching
├─ Identify patterns in file
├─ Compare with AGENTS.md rules
├─ Find similar implementations
└─ Event: "Patterns identified"

Step 3: Local Solution
├─ Check local fixes first
├─ Use existing patterns
├─ Apply consistent style
└─ Event: "Fix applied"
```

## 📋 AGENTS.md Structure

### Auto-Generated Content
```markdown
# AGENTS.md

## Project Context
- Name: Dashboard App
- Stack: React, TypeScript, Tailwind
- Architecture: Component-based

## Patterns
- Components: Use designOS tokens
- State: Redux for global, Context for local
- Styling: Tailwind + CSS modules

## Rules
1. Files <200 lines (SRP)
2. Use function keyword (not arrow)
3. Explicit return types
4. No nested ternaries

## Related Files
- @components/Button.tsx
- @components/Input.tsx
- @utils/validation.ts
- @hooks/useAuth.ts
```

### When Updated
- After major changes
- When patterns shift
- New dependencies added
- Architecture evolves

## 🔧 Pattern Matching Examples

### File References
```
User: "Update @components/Login.tsx"
→ Auto-reads file
→ Finds @components/Button.tsx
→ Applies consistent patterns
→ Updates both files

User: "Fix @utils/ validation"
→ Scans @utils/ directory
→ Finds all validation files
→ Applies consistent fix
→ Updates all matching files
```

### Folder References
```
User: "Refactor @components/"
→ Reads all components
→ Identifies patterns
→ Applies refactoring
→ Maintains consistency
```

## 🎯 Local Solution Priority

### Priority Chain
```javascript
1. Same file (immediate fix)
2. Same folder (pattern match)
3. Project-wide (AGENTS.md)
4. Monorepo (shared patterns)
5. External (last resort)
```

### Example
```
Problem: Need auth component
Priority:
1. Check @components/Auth.tsx (exists → use it)
2. Check @components/ (similar → adapt)
3. Check AGENTS.md (rules → follow)
4. Check monorepo (shared → import)
5. Create new (only if none exist)
```

## 📊 Performance Metrics

| Metric | Target | Achievement |
|--------|--------|-------------|
| Context Injection | 100% | ✅ |
| Pattern Matching | Automatic | ✅ |
| Local Solutions | >80% | ✅ |
| Consistency | High | ✅ |

## 🔧 Integration with Other Frameworks

### Cursor + Amp
- Cursor: Pattern matching
- Amp: Concise outputs
- Result: Fast + consistent

### Cursor + Devin
- Cursor: Local solutions
- Devin: LSP verification
- Result: Safe + efficient

### Cursor + Manus
- Cursor: AGENTS.md context
- Manus: Knowledge persistence
- Result: Context-aware + traceable

## ⚡ Quick Commands

| Command | Description |
|---------|-------------|
| "Fix @file" | Pattern match fix |
| "Refactor @folder/" | Folder-wide changes |
| "Use AGENTS.md" | Inject context |
| "Local solution" | Prioritize local |

## 🎯 Best Practices

1. **Always** check AGENTS.md first
2. **Use** @file references
3. **Prefer** local solutions
4. **Maintain** pattern consistency
5. **Update** AGENTS.md regularly

## 📚 Reference

- **Source**: x1xhlol/system-prompts-and-models-of-ai-tools
- **Model**: Cursor IDE patterns
- **Pattern**: AGENTS.md + @references
- **Integration**: Full Claude Code support

---

**Next**: See [Ralph-Loop Guide](ralph-loop-guide.md) for uncensored generation