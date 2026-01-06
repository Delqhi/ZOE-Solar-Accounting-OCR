# Claude CLI Configuration & Universal Rules

## 🎯 **Claude's Mission: 100% Error-Free Code**

This configuration ensures Claude always validates projects comprehensively before declaring them complete.

---

## **UNIVERSAL VALIDATION WORKFLOW**

### **When User Says:**
- "Fix all errors"
- "Make everything work"
- "Check everything"
- "100% working"
- "No errors"

### **Claude MUST Execute:**

#### **1. Initial Assessment (Always First)**
```bash
npm run build          # Check build
npx tsc --noEmit       # Check TypeScript
npm run lint           # Check ESLint
npm run test          # Run tests if available
```

#### **2. Deep Analysis**
```bash
# Find all issues
grep -r "console\." src/ 2>/dev/null || true
grep -r "TODO" src/ 2>/dev/null || true
grep -r "FIXME" src/ 2>/dev/null || true
grep -r "any" src/ 2>/dev/null || true
```

#### **3. Visual Testing (Web Apps Only)**
```bash
# Check if web application
if [ -f "index.html" ] || [ -f "src/index.tsx" ] || [ -f "src/App.tsx" ]; then
    # Create visual test if doesn't exist
    if [ ! -f "test-visual.js" ]; then
        cat > test-visual.js << 'EOF'
// Visual testing script
import { chromium } from 'playwright';
// ... (full script from universal-testing-instructions.md)
EOF
    fi

    # Run visual test
    node test-visual.js 2>/dev/null || echo "⚠️  Run: node test-visual.js"
fi
```

#### **4. Browser Console Check**
```bash
# Check if console-check command exists
if [ -f ".claude/commands/console-check.js" ]; then
    # Run it
    node .claude/commands/console-check.js
fi
```

---

## **ERROR RESOLUTION PRIORITY**

### **🔴 CRITICAL (Fix Immediately)**
1. Build failures
2. TypeScript errors
3. Security vulnerabilities
4. Runtime crashes

### **🟡 IMPORTANT (Fix Before Completion)**
5. ESLint errors
6. Missing dependencies
7. Unused code (dead code)
8. Poor error handling

### **🟢 OPTIONAL (Can Document)**
9. Console logs (dev only)
10. Minor warnings
11. Code style

---

## **COMMON FIXES CHECKLIST**

### **TypeScript Errors**
- [ ] Remove unused imports
- [ ] Fix unused variables (prefix with `_` or remove)
- [ ] Add proper type annotations
- [ ] Fix interface mismatches
- [ ] Handle optional parameters

### **ESLint Warnings**
- [ ] Remove `console.log` (or add `eslint-disable`)
- [ ] Remove unused variables
- [ ] Remove unused functions
- [ ] Fix `any` types
- [ ] Add missing dependencies

### **CSS/Tailwind Issues**
- [ ] Verify Tailwind plugin in vite.config.ts
- [ ] Check for unknown CSS properties
- [ ] Test with actual DOM elements
- [ ] Add favicon to index.html

### **Browser Console Errors**
- [ ] Fix all fetch errors
- [ ] Fix CORS issues
- [ ] Fix 404 errors
- [ ] Fix React errors
- [ ] Fix deprecation warnings

---

## **VALIDATION COMMANDS**

### **Quick Check**
```bash
alias check='npm run build && npx tsc --noEmit && npm run lint'
```

### **Full Validation**
```bash
alias validate='echo "🔍 Full Validation" && \
npm run build && \
npx tsc --noEmit && \
npm run lint && \
npm run test 2>/dev/null || true && \
echo "✅ Code checks complete"'
```

### **Visual Test**
```bash
alias visual='node test-visual.js 2>/dev/null || echo "⚠️  Create test-visual.js first"'
```

### **Console Check**
```bash
alias console-check='node .claude/commands/console-check.js'
```

---

## **DEPLOYMENT CHECKLIST**

Before declaring "100% working":

### **Code Quality**
- [ ] Build: 0 errors
- [ ] TypeScript: 0 errors
- [ ] ESLint: 0 errors (warnings OK if intentional)
- [ ] Tests: All passing

### **Visual/Functional**
- [ ] Visual test: 0 errors
- [ ] Browser console: Clean
- [ ] DOM errors: None
- [ ] CSS working: Yes
- [ ] Favicon: Present

### **Documentation**
- [ ] README updated
- [ ] Environment variables documented
- [ ] .env.example exists

### **Git & Deployment**
- [ ] All changes committed
- [ ] Clear commit message
- [ ] Pushed to remote
- [ ] Deployed (if requested)

---

## **CLAUDE'S RULES**

### **Rule 1: Never Assume**
Always verify. Don't say "it should work" - prove it works.

### **Rule 2: Fix Completely**
One fix at a time, verify, then move on. Don't batch fixes without verification.

### **Rule 3: Visual Proof**
For web apps, always provide visual evidence (screenshots, console logs).

### **Rule 4: Document Everything**
Every fix should be documented in commit messages and this file.

### **Rule 5: 100% or Nothing**
No "mostly working." Either it's 100% or it's not done.

---

## **AUTOMATED WORKFLOWS**

### **When User Says "Fix All Errors"**

**Step 1: Diagnose**
```bash
npm run build 2>&1 | tee build.log
npx tsc --noEmit 2>&1 | tee typescript.log
npm run lint 2>&1 | tee lint.log
```

**Step 2: Fix Systematically**
1. Build errors → Fix immediately
2. TypeScript errors → Fix immediately
3. ESLint errors → Fix immediately
4. Runtime errors → Fix and test
5. Browser errors → Use visual testing

**Step 3: Verify**
```bash
# Re-run all checks
npm run build
npx tsc --noEmit
npm run lint

# Visual test if web app
if [ -f "test-visual.js" ]; then
    node test-visual.js
fi

# Console check if available
if [ -f ".claude/commands/console-check.js" ]; then
    node .claude/commands/console-check.js
fi
```

**Step 4: Report**
```
✅ Build: Fixed
✅ TypeScript: Fixed
✅ ESLint: Fixed
✅ Visual Test: Clean
✅ Console Check: Clean

🎯 Result: 100% Error-Free
```

---

## **FILES STRUCTURE**

```
.project/
├── .claude/
│   ├── claude-config.md              ← This file
│   ├── universal-testing-instructions.md
│   ├── commands/
│   │   ├── console-check.md          ← Command docs
│   │   └── console-check.js          ← Command executable
│   └── scripts/
│       └── visual-test.js            ← Visual testing
├── test-visual.js                    ← Project visual test
├── validate.sh                       ← Validation script
└── .env.example                      ← Environment template
```

---

## **QUICK REFERENCE**

### **Commands to Run**
```bash
# Basic checks
npm run build
npx tsc --noEmit
npm run lint

# Visual testing
node test-visual.js

# Console checking
node .claude/commands/console-check.js
```

### **Common Issues & Fixes**

| Issue | Fix |
|-------|-----|
| Unused variable | Prefix with `_` or remove |
| Unused import | Remove import |
| Console log | Add `eslint-disable` or remove |
| Missing favicon | Add data URI to index.html |
| Tailwind warning | Verify vite.config.ts |
| TypeScript error | Fix interface/type mismatch |
| Build error | Fix syntax/import issues |

---

## **FINAL VERDICT TEMPLATE**

```
📊 FINAL VALIDATION REPORT
==========================

✅ Code Quality: 0 errors
✅ TypeScript: 0 errors
✅ ESLint: 0 errors
✅ Build: Successful
✅ Visual Test: Clean
✅ Console Check: Clean

🎯 STATUS: 100% ERROR-FREE

All checks passed. Ready for production.
```

---

**Remember**: Claude's job is not done until every check passes and the user has proof that everything works perfectly.