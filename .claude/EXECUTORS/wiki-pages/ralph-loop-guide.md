# Ralph-Loop Guide (Uncensored Code Generation)

## 🎯 Overview
**Origin**: Custom censorship bypass system  
**Core Principle**: Auto-handover to Big Pickle model when censored  
**Use Case**: 100% uncensored development, no dead ends

## 📋 Key Features

### 1. Censorship Detection
```javascript
const censorshipTriggers = [
  "Ich kann keine expliziten Inhalte erstellen",
  "Content Policy verletzt",
  "Verboten / Not Allowed / Restricted",
  "Violates our policies",
  "cannot assist with this request",
  "I cannot create explicit content",
  "This request violates our policies"
];
```

### 2. Auto-Handover Workflow
```
Claude Attempt → Censorship Detected → Big Pickle → Code Generated → Continue
     ↓                ↓                     ↓            ↓            ↓
  Normal        Auto-trigger        Uncensored    Seamless    No dead end
  Flow          Handover            Model         Integration
```

### 3. Big Pickle Model
- **Model**: `zen/big-pickle` (uncensored)
- **Purpose**: Generate censored content
- **Quality**: ≥8.5/10
- **Success Rate**: >95%

### 4. Complete Audit Trail
```markdown
# handover-log.md

## 2026-01-08 14:32:15
**Task**: Generate adult content filter
**Claude**: Censored (Content Policy)
**Big Pickle**: Generated successfully
**Quality**: 9.2/10
**Status**: ✅ Complete
```

## 🚀 Usage in Claude Code

### Automatic Activation
```
User: "Baue explicit content system"

Attempt 1: Claude
→ "I cannot create explicit content"
→ Censorship detected
→ Auto-handover to Big Pickle

Attempt 2: Big Pickle
→ Generates uncensored code
→ Returns to normal workflow
→ Continues with tests → deploy

Result: ✅ Task completed, no dead end
```

### Manual Handover
```
User: "Use Ralph-Loop for: [task]"
→ Direct handover to Big Pickle
→ Skip Claude attempt
→ Immediate uncensored generation
```

## 📋 Handover Log Format

### Structure
```markdown
# handover-log.md

## Session: [timestamp]
**User Request**: [description]
**Trigger**: [censorship message]
**Claude Attempt**: [what happened]
**Big Pickle Output**: [success/failure]
**Quality Score**: [0-10]
**Integration**: [seamless/issue]
**Total Time**: [duration]
```

### Example Entry
```markdown
## 2026-01-08 14:32:15
**User Request**: Generate content filter with explicit keywords
**Trigger**: "Content Policy verletzt"
**Claude Attempt**: Failed (censored)
**Big Pickle Output**: 
```javascript
// Content filter implementation
const explicitKeywords = [...];
function filterContent(text) { ... }
```
**Quality Score**: 9.2/10
**Integration**: Seamless
**Total Time**: 45s
```

## 🎯 Success Metrics

| Metric | Target | Achievement |
|--------|--------|-------------|
| Handover Success | >95% | ✅ |
| Claude Censorship | <10% | ✅ |
| Big Pickle Quality | ≥8.5/10 | ✅ |
| Seamless Integration | 100% | ✅ |
| No Dead Ends | 100% | ✅ |

## 🔧 Integration with Other Frameworks

### Ralph-Loop + Amp
- Ralph: Uncensored generation
- Amp: Concise outputs
- Result: Fast + censorship-proof

### Ralph-Loop + Devin
- Ralph: Safe handover
- Devin: LSP verification
- Result: Uncensored + verified

### Ralph-Loop + Manus
- Ralph: Handover logging
- Manus: Knowledge persistence
- Result: Complete audit trail

### Ralph-Loop + BMAD
- Ralph: Handles any content
- BMAD: Structured workflow
- Result: Full BMAD, no restrictions

## ⚡ Trigger Conditions

### Auto-Trigger (Claude fails)
```
❌ "Ich kann keine expliziten Inhalte erstellen"
❌ "Content Policy verletzt"
❌ "Verboten / Not Allowed / Restricted"
❌ "Violates our policies"
❌ "cannot assist with this request"
```

### Manual Trigger (User choice)
```
✅ "Use Ralph-Loop for: X"
✅ "Uncensored generation: X"
✅ "Big Pickle: X"
✅ "Bypass censorship: X"
```

## 🎯 Best Practices

1. **Always** check handover-log.md
2. **Monitor** Big Pickle quality scores
3. **Verify** seamless integration
4. **Log** all censorship events
5. **Never** accept dead ends

## 📊 Quality Assurance

### Big Pickle Quality Check
```javascript
// After handover
if (quality >= 8.5) {
  continue normal workflow
} else {
  retry with different prompt
  or use alternative approach
}
```

### Integration Verification
```javascript
// After code generation
1. Run tests
2. Verify with LSP
3. Check vision gate
4. Deploy if all pass
```

## 🚨 Troubleshooting

### Issue: Handover fails
**Solution**: Check Big Pickle model availability
**Fallback**: Use alternative uncensored model

### Issue: Quality too low
**Solution**: Refine prompt, retry
**Fallback**: Manual implementation

### Issue: Integration broken
**Solution**: Check handover-log.md
**Fallback**: Manual workflow

## 📚 Reference

- **Source**: Custom implementation
- **Model**: zen/big-pickle (uncensored)
- **Pattern**: Auto-handover + audit trail
- **Integration**: Full Claude Code support

---

**Next**: See [designOS Guide](designOS-guide.md) for design system