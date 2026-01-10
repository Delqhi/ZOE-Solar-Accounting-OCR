# Vision Gate Guide (UI/UX Quality Scoring)

## 🎯 Overview
**Origin**: AI-powered visual quality assessment  
**Core Principle**: Automated UI/UX review with ≥8.5/10 score requirement  
**Use Case**: Visual quality validation before deployment

## 📋 Key Features

### 1. Quality Scoring System
```javascript
score = {
  ui: 9.0,      // Visual design
  ux: 8.8,      // User experience
  accessibility: 9.2,  // WCAG compliance
  responsiveness: 8.5, // Mobile-first
  consistency: 9.0,    // Design system
  overall: 8.9         // Weighted average
}
```

### 2. SiliconFlow Integration
```javascript
// FREE AI-powered visual analysis
const siliconFlow = {
  model: "siliconflow-vision",
  cost: 0,  // FREE
  capabilities: [
    "UI element detection",
    "Color contrast analysis",
    "Layout evaluation",
    "Typography assessment",
    "Accessibility scoring"
  ]
}
```

### 3. Skyvern Screenshot Integration
```javascript
skyvern: {
  baseURL: "http://130.162.235.142:8000",
  capabilities: [
    "Live screenshots",
    "Responsive testing",
    "Cross-browser verification",
    "Visual regression"
  ]
}
```

### 4. Auto-Fix System
```javascript
fixes: {
  autoApply: true,
  maxRetries: 3,
  types: [
    "Tailwind CSS corrections",
    "Color contrast fixes",
    "Spacing adjustments",
    "Typography improvements",
    "Accessibility patches"
  ]
}
```

### 5. State Persistence
```javascript
// .claude/VISION_STATE.md
{
  lastScore: 8.9,
  attempts: 2,
  fixesApplied: 5,
  issues: [],
  timestamp: "2026-01-08T14:32:15"
}
```

## 🚀 Usage in Claude Code

### Activation Triggers
```
"Vision Gate: Check UI" → Quality scoring
"SiliconFlow analysis" → Visual assessment
"Skyvern screenshot" → Live verification
"Auto-fix UI issues" → Fix generation
```

### Complete Vision Gate Workflow
```
User: "Deploy dashboard with vision gate"

Step 1: Initial Assessment
├─ SiliconFlow scans UI
├─ Generates score: 7.2/10
├─ Identifies issues:
│  - Color contrast (WCAG AA)
│  - Spacing inconsistency
│  - Typography scale
└─ Event: "Score: 7.2 (FAIL)"

Step 2: Auto-Fix Attempt 1
├─ Apply Tailwind corrections
├─ Fix color contrast
├─ Standardize spacing
├─ Rescore: 8.1/10
└─ Event: "Score: 8.1 (FAIL)"

Step 3: Auto-Fix Attempt 2
├─ Typography scale fix
├─ Component alignment
├─ Mobile responsiveness
├─ Rescore: 8.7/10
└─ Event: "Score: 8.7 (PASS)"

Step 4: Skyvern Verification
├─ Take live screenshots
├─ Test responsive breakpoints
├─ Cross-browser check
├─ Final verification
└─ Event: "Vision Gate Passed"
```

## 📋 Scoring Criteria

### UI Design (30% weight)
```javascript
{
  visualHierarchy: 9.0,    // Clear information architecture
  colorHarmony: 8.5,       // Consistent color palette
  typography: 9.2,         // Readable, scalable
  whiteSpace: 8.8,         // Balanced breathing room
  alignment: 9.0           // Grid-based layout
}
```

### User Experience (30% weight)
```javascript
{
  navigation: 8.8,         // Intuitive flow
  feedback: 9.0,           // Clear responses
  errorHandling: 8.5,      // Helpful error messages
  performance: 8.7,        // Fast interactions
  accessibility: 9.2       // WCAG AA compliant
}
```

### Responsiveness (20% weight)
```javascript
{
  mobile: 8.5,             // Mobile-first design
  tablet: 8.7,             // Tablet optimization
  desktop: 9.0,            // Desktop experience
  breakpoints: 8.8         // Fluid transitions
}
```

### Consistency (20% weight)
```javascript
{
  components: 9.0,         // Reusable patterns
  spacing: 8.8,            // Consistent scale
  colors: 9.2,             // Design tokens
  typography: 9.0          // Type scale
}
```

## 🔧 Auto-Fix Types

### 1. Tailwind CSS Corrections
```diff
- <div class="p-4 m-2">
+ <div class="p-4 m-4">  // Consistent spacing scale
```

### 2. Color Contrast Fixes
```diff
- <p class="text-gray-400 bg-gray-800">
+ <p class="text-gray-300 bg-gray-800">  // WCAG AA compliant
```

### 3. Spacing Standardization
```diff
- <div class="mb-2">
+ <div class="mb-4">  // designOS spacing scale
```

### 4. Typography Improvements
```diff
- <h1 class="text-2xl">
+ <h1 class="text-3xl font-bold">  // Proper hierarchy
```

### 5. Accessibility Patches
```diff
- <button>Click</button>
+ <button aria-label="Submit form">Click</button>
```

## 📊 State Management

### Vision State File
```markdown
# VISION_STATE.md

## Current Status
**Score**: 8.7/10 ✅
**Attempts**: 2/3
**Status**: PASSED

## Issues Fixed
1. ✅ Color contrast (7.2 → 8.1)
2. ✅ Spacing scale (8.1 → 8.5)
3. ✅ Typography (8.5 → 8.7)

## Remaining Issues
- None

## Timestamp
2026-01-08 14:32:15

## Next Steps
✅ Ready for deployment
```

### Auto-Persistence
```javascript
// After every score update
function updateVisionState(score, fixes) {
  const state = {
    lastScore: score,
    attempts: state.attempts + 1,
    fixesApplied: fixes.length,
    issues: fixes,
    timestamp: new Date().toISOString()
  };
  
  fs.writeFileSync(
    '.claude/VISION_STATE.md',
    formatMarkdown(state)
  );
}
```

## 🎯 Success Criteria

### Minimum Requirements
```javascript
const requirements = {
  overall: 8.5,      // Must achieve
  ui: 8.0,           // Minimum visual
  ux: 8.0,           // Minimum experience
  accessibility: 8.5, // WCAG AA
  responsiveness: 8.0, // Mobile-friendly
  consistency: 8.5    // Design system
};
```

### Deployment Gate
```
IF overall >= 8.5 AND
   accessibility >= 8.5 AND
   no critical issues
THEN: APPROVE deployment
ELSE: Auto-fix or reject
```

## 🔧 Integration with Other Frameworks

### Vision Gate + Amp
- Vision: Quality scoring
- Amp: Concise reports
- Result: Fast quality checks

### Vision Gate + Devin
- Vision: Visual assessment
- Devin: LSP code fixes
- Result: Visual + code quality

### Vision Gate + Manus
- Vision: State persistence
- Manus: Knowledge module
- Result: Learning from fixes

### Vision Gate + Ralph-Loop
- Vision: Any UI content
- Ralph: Uncensored fixes
- Result: No content restrictions

### Vision Gate + designOS
- Vision: designOS compliance
- designOS: Token system
- Result: Consistent scoring

## ⚡ Quick Commands

| Command | Description |
|---------|-------------|
| "Vision Gate: Check" | Full assessment |
| "SiliconFlow score" | Visual scoring |
| "Skyvern screenshot" | Live verification |
| "Auto-fix UI" | Generate fixes |
| "Vision status" | Show state |

## 🎯 Best Practices

1. **Always** run before deploy
2. **Auto-fix** up to 3 times
3. **Persist** state after each fix
4. **Verify** with Skyvern
5. **Never** deploy below 8.5

## 📊 Performance Metrics

| Metric | Target | Achievement |
|--------|--------|-------------|
| Score ≥8.5 | 100% | ✅ |
| Auto-Fix Success | >70% | ✅ |
| Skyvern Verification | 100% | ✅ |
| State Persistence | 100% | ✅ |
| Deployment Success | >95% | ✅ |

## 🚨 Troubleshooting

### Issue: Score stuck at 8.4
**Solution**: Manual review, targeted fixes
**Fallback**: Designer intervention

### Issue: Auto-fix fails
**Solution**: Check Tailwind config
**Fallback**: Manual CSS

### Issue: Skyvern timeout
**Solution**: Retry with longer timeout
**Fallback**: Manual screenshot

## 📚 Reference

- **Source**: Custom implementation
- **Tools**: SiliconFlow + Skyvern
- **Pattern**: AI-powered visual scoring
- **Integration**: Full Claude Code support

---

**Next**: See [Quick Reference](quick-reference.md) for all commands