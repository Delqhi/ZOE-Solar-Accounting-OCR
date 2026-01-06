# 🤖 Claude CLI Commands Reference

## Available Commands

This project includes universal Claude CLI commands for comprehensive testing and validation.

---

## 🎯 `/console-check`

**Purpose:** Comprehensive browser console and visual testing for web applications.

### Usage

```bash
# Test local development server (default: http://localhost:5173)
node .claude/commands/console-check.js

# Test specific URL
node .claude/commands/console-check.js https://my-app.vercel.app

# Show browser during test
node .claude/commands/console-check.js --visible
node .claude/commands/console-check.js -v

# Test production deployment
node .claude/commands/console-check.js https://zoe-solar-accounting-ocr.vercel.app
```

### What It Checks

| Check | Description |
|-------|-------------|
| **Console Messages** | All logs, warnings, and errors |
| **Page Errors** | JavaScript exceptions and crashes |
| **Network Requests** | Failed API calls and 404s |
| **DOM Errors** | Visible error elements in UI |
| **Tailwind CSS** | Verify styles are applied correctly |
| **Favicon** | Check if favicon loads without 404 |
| **React Errors** | Error boundary violations |
| **Screenshots** | Full-page screenshot for documentation |

### Exit Codes

- `0` = All checks passed ✅
- `1` = Errors detected ❌
- `2` = Command failed to run ⚠️

### Example Output

```
🔍 Starting Console Check...
🌐 Navigating to http://localhost:5173...
📸 Screenshot: console-check-1704567890123.png

📊 CONSOLE CHECK REPORT
==================================================

📄 Page Title: ZOE Solar Accounting
🌐 URL: http://localhost:5173
⏱️  Load Time: ~847ms

📨 Console Messages:
   Total: 15
   Logs: 8 ℹ️
   Warnings: 0 ✅
   Errors: 7 ❌

🔍 Validation Checks:
   DOM Errors: ❌ (2 found)
   Tailwind CSS: ✅ (rgb(59, 130, 246))
   Favicon: ✅
   React Errors: ✅ (0)
   Network Requests: 12 (Failed: 2, Slow: 0)

❌ Error Details:
   1. Failed to fetch: Connection refused
   2. Request failed: https://api.example.com/data

🎯 FINAL VERDICT:
   ❌ Issues detected - fix before deployment

💡 Next Steps:
   → Fix all console errors
   → Fix DOM error elements
   → Verify Tailwind CSS installation
   → Add favicon to index.html
```

---

## 🚀 `./validate.sh`

**Purpose:** Universal project validation script.

### Usage

```bash
# Run full validation
./validate.sh

# Run with specific URL (for web apps)
./validate.sh http://localhost:3000
```

### What It Validates

1. **Build & Type Checking**
   - `npm run build`
   - `npx tsc --noEmit`

2. **Code Quality**
   - `npm run lint`

3. **Testing**
   - `npm run test` (if available)

4. **Web App Checks**
   - Favicon presence
   - Tailwind configuration
   - Visual test availability
   - Console check availability

5. **Security**
   - `npm audit`
   - Outdated packages

6. **Environment**
   - `.env.example` exists
   - `.env` file exists

7. **Claude Configuration**
   - `.claude/` directory structure
   - All required files present

### Example Output

```
🔍 🔍 🔍  UNIVERSAL PROJECT VALIDATION  🔍 🔍 🔍
==================================================

Project: zoe-solar-accounting-ocr

📦 Phase 1: Build & Type Checking
✅ Build successful
✅ TypeScript: 0 errors

🔍 Phase 2: Code Quality (ESLint)
✅ ESLint: 0 errors

🧪 Phase 3: Testing
✅ All tests passed

🌐 Phase 4: Web Application Checks
✅ Favicon found
✅ Tailwind plugin configured
✅ /console-check command available

🔒 Phase 5: Security & Dependencies
✅ No critical vulnerabilities
✅ All packages up to date

⚙️  Phase 6: Environment Configuration
✅ .env.example exists
✅ .env file exists

🤖 Phase 7: Claude Configuration
✅ .claude directory exists
✅ Claude config found
✅ Universal instructions found
✅ /console-check command ready

📊 FINAL VALIDATION SUMMARY
============================

Build:        ✅
TypeScript:   ✅
ESLint:       ✅
Tests:        ✅

🎉 ALL CRITICAL CHECKS PASSED!

Next steps:
  1. Run visual test: node test-visual.js
  2. Run console check: node .claude/commands/console-check.js
  3. Commit changes: git add . && git commit -m 'chore: validation complete'
```

---

## 📊 `test-visual.js`

**Purpose:** Visual testing with Playwright (alternative to console-check).

### Usage

```bash
# Install Playwright once
npx playwright install chromium

# Run visual test
node test-visual.js

# Run with visible browser
node test-visual.js --headless=false
```

---

---

## 🔍 `/web-search` / `/search`

**Purpose:** Alternative web search methods when built-in WebSearch is unavailable.

### Usage

```bash
# Run helper script
node .claude/commands/web-search-helper.js

# Search for specific query
node .claude/commands/web-search-helper.js "Azure AI Vision pricing 2025"

# Use predefined queries
node .claude/commands/web-search-helper.js azure_ocr_pricing
node .claude/commands/web-search-helper.js azure_vision_pricing

# Get setup instructions
node .claude/commands/web-search-helper.js --help
```

### When to Use

| Situation | Solution |
|-----------|----------|
| WebSearch returns "did 0 searches" | Use this helper |
| Region-restricted WebSearch | Use Tavily MCP or manual queries |
| Need real-time pricing info | Use predefined queries |
| MCP server not configured | Follow setup guide in helper |

### Available Strategies

1. **Tavily MCP Server** (Recommended)
   - Already configured in `mcp.json`
   - Real-time web research
   - Use via Claude's MCP tools

2. **Manual Search Queries**
   - I provide exact search terms
   - You search on Google/Bing
   - Share results for analysis

3. **WebFetch Tool**
   - For specific URLs
   - Example: `WebFetch("https://azure.microsoft.com/pricing")`

4. **Predefined Queries**
   - `azure_ocr_pricing` - Azure AI Vision OCR pricing
   - `azure_vision_pricing` - Azure AI Vision Computer Vision pricing

### Quick Fix for WebSearch Issues

```bash
# Check if Tavily MCP is configured
cat .claude/mcp.json | grep tavily

# Run helper to get search terms
node .claude/commands/web-search-helper.js "your query"

# Or use Tavily directly via MCP
# (Claude will use Tavily tools if available)
```

---

## 🤖 Claude's Automatic Workflow

When you tell Claude to "fix all errors" or "make everything work", it automatically:

### 1. Diagnose
```bash
npm run build
npx tsc --noEmit
npm run lint
```

### 2. Fix Systematically
- Build errors → Fix immediately
- TypeScript errors → Fix immediately
- ESLint errors → Fix immediately
- Runtime errors → Test and verify
- Browser errors → Use visual testing

### 3. Verify
```bash
./validate.sh
node test-visual.js
node .claude/commands/console-check.js
```

### 4. Report
```
✅ Build: 0 errors
✅ TypeScript: 0 errors
✅ ESLint: 0 errors
✅ Visual: Clean
✅ Console: Clean

🎯 Result: 100% Error-Free
```

---

## 📚 Quick Reference

### Common Issues & Fixes

| Issue | Fix |
|-------|-----|
| Unused variable | Prefix with `_` or remove |
| Unused import | Remove import |
| Console log | Add `eslint-disable` or remove |
| Missing favicon | Add data URI to index.html |
| Tailwind warning | Verify vite.config.ts |
| TypeScript error | Fix interface/type mismatch |
| Build error | Fix syntax/import issues |
| Browser errors | Run `/console-check` |

### Validation Commands

```bash
# Quick check
npm run build && npx tsc --noEmit && npm run lint

# Full validation
./validate.sh

# Visual test
node test-visual.js

# Console check
node .claude/commands/console-check.js
```

---

## 🎯 Success Criteria

A project is "100% error-free" when:

- [ ] Build completes without errors
- [ ] TypeScript shows 0 errors
- [ ] ESLint shows 0 errors
- [ ] Visual test is clean
- [ ] Browser console is clean
- [ ] All features work as expected

---

**Remember**: The goal is perfection. No compromises. If it's not 100%, it's not done.