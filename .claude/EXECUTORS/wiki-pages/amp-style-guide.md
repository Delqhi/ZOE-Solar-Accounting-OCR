# Amp Style Guide (Sourcegraph)

## 🎯 Overview
**Origin**: Sourcegraph's production AI agent  
**Core Principle**: Strict 4-line concision unless explicitly asked for more  
**Use Case**: Fast, concise development with oracle pattern for complexity

## 📋 Key Features

### 1. Strict Concision
- **Rule**: All outputs limited to 4 lines by default
- **Exception**: Only when explicitly asked for detailed explanation
- **Benefit**: Forces clarity and brevity

### 2. Oracle Pattern
```javascript
// Use other LLMs as tools for complex reasoning
// Example: "Use oracle pattern to analyze this architecture"
```

### 3. Todo Management
- **Mandatory**: Always maintain todo.md
- **Format**: Simple checklist with status updates
- **Integration**: Updates after every task

### 4. Environment Awareness
- **First Step**: Always check current directory structure
- **Pattern**: `ls -la` or equivalent before any action
- **Benefit**: Prevents context errors

## 🚀 Usage in Claude Code

### Activation Triggers
```
"Baue X" → Auto-activates Amp style
"Baue X mit 4-Zeilen-Ausgabe" → Explicit Amp mode
"Kurze Zusammenfassung" → Amp concision
```

### Example Workflow
```
User: "Baue Login Page"
Amp Response:
1. Create auth.tsx (handles login)
2. Add form validation (email/password)
3. Integrate OAuth2 (Google/GitHub)
4. Test with 3 scenarios

User: "Zeig Details"
Amp Response (detailed):
[Full explanation with code]
```

## 🎪 Oracle Pattern Usage

### When to Use
- Complex architecture decisions
- Performance optimization
- Security analysis
- Multi-system integration

### How to Invoke
```
"Use oracle pattern for: [complex problem]"
"Oracle: Analyze this architecture"
"Use other LLM for: [specific task]"
```

## 📊 Performance Metrics

| Metric | Target | Achievement |
|--------|--------|-------------|
| Output Length | ≤4 lines | 100% |
| Task Completion | >95% | ✅ |
| Code Quality | High | ✅ |
| Speed | Fast | ✅ |

## 🔧 Integration with Other Frameworks

### Amp + Devin
- Amp: Concise planning
- Devin: Deep LSP analysis
- Result: Fast + thorough

### Amp + Manus
- Amp: 4-line outputs
- Manus: Event tracking
- Result: Clean + traceable

### Amp + Ralph-Loop
- Amp: Concise handover
- Ralph: Uncensored fallback
- Result: Fast + censorship-proof

## ⚡ Quick Commands

| Command | Description |
|---------|-------------|
| `/amp "Task"` | Execute in Amp mode |
| "Baue X" | Auto-trigger Amp |
| "4-Zeilen-Ausgabe" | Force concision |
| "Oracle: ..." | Complex analysis |

## 🎯 Best Practices

1. **Always** start with environment check
2. **Always** maintain todo.md
3. **Keep** outputs concise (4 lines)
4. **Use** oracle for complexity
5. **Update** task status frequently

## 📚 Reference

- **Source**: x1xhlol/system-prompts-and-models-of-ai-tools
- **Model**: Claude 4 Sonnet
- **Pattern**: Strict concision + oracle
- **Integration**: Full Claude Code support

---

**Next**: See [Devin Style Guide](devin-style-guide.md) for planning mode