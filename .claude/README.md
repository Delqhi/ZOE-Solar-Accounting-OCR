# 🤖 Claude CLI Configuration

This directory contains universal testing and validation instructions for Claude Code to ensure 100% error-free code.

## 📁 Files

### Core Configuration
- **`claude-config.md`** - Universal rules and workflows for Claude
- **`universal-testing-instructions.md`** - Comprehensive testing guide

### Commands
- **`commands/console-check.js`** - `/console-check` command executable
- **`commands/console-check.md`** - Command documentation

## 🎯 Quick Usage

### For Claude Code
When working on this project, Claude will automatically:
1. Run build, TypeScript, and ESLint checks
2. Perform visual testing for web apps
3. Check browser console for errors
4. Validate all fixes before declaring completion

### Manual Commands
```bash
# Run validation script
./validate.sh

# Run visual test
node test-visual.js

# Run console check
node .claude/commands/console-check.js
```

## 🚀 Universal Commands

### `/console-check`
Comprehensive browser console and visual testing.

**Usage:**
```bash
/console-check                    # Test localhost:5173
/console-check --visible          # Show browser
/console-check https://app.com    # Test production
```

**What it does:**
- ✅ Captures all console messages
- ✅ Takes screenshots
- ✅ Checks for DOM errors
- ✅ Validates Tailwind CSS
- ✅ Verifies favicon
- ✅ Detects React errors
- ✅ Monitors network requests

## 📋 Validation Workflow

### When User Says "Fix All Errors"

**Claude's Automatic Process:**

1. **Diagnose**
   ```bash
   npm run build
   npx tsc --noEmit
   npm run lint
   ```

2. **Fix Systematically**
   - Build errors → Fix immediately
   - TypeScript errors → Fix immediately
   - ESLint errors → Fix immediately
   - Runtime errors → Test and verify
   - Browser errors → Use visual testing

3. **Verify**
   ```bash
   node test-visual.js
   node .claude/commands/console-check.js
   ```

4. **Report**
   ```
   ✅ Build: 0 errors
   ✅ TypeScript: 0 errors
   ✅ ESLint: 0 errors
   ✅ Visual: Clean
   ✅ Console: Clean
   ```

## 🔧 Project-Specific Rules

### Web Application Requirements
- ✅ Favicon in index.html (data URI)
- ✅ Tailwind CSS properly configured
- ✅ No console.log in production code
- ✅ All unused imports removed
- ✅ All unused variables prefixed with `_` or removed

### Error Handling
- ✅ Use error boundaries
- ✅ Proper error messages
- ✅ No unhandled promises
- ✅ Graceful degradation

## 📚 Reference

See `universal-testing-instructions.md` for:
- Complete validation checklist
- Common fixes and patterns
- Browser testing workflows
- Deployment checklist
- Troubleshooting guide

## ✅ Success Criteria

A project is "100% error-free" when:
- [ ] Build completes without errors
- [ ] TypeScript shows 0 errors
- [ ] ESLint shows 0 errors
- [ ] Visual test is clean
- [ ] Browser console is clean
- [ ] All features work as expected

---

**Remember**: The goal is perfection. No compromises. If it's not 100%, it's not done.