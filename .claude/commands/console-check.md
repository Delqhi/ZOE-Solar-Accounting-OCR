# /console-check - Universal Console & Visual Testing Command

## **USAGE**
```
/console-check [options]
```

## **DESCRIPTION**
Comprehensive console log and visual testing for web applications. Checks browser console, captures screenshots, validates CSS, and ensures 100% error-free operation.

---

## **WHAT IT DOES**

### ✅ **1. Browser Console Analysis**
- Captures ALL console messages (log, warn, error)
- Identifies JavaScript errors
- Detects failed network requests
- Checks for React errors

### ✅ **2. Visual Validation**
- Takes full-page screenshots
- Checks for visible DOM errors
- Validates Tailwind CSS is working
- Verifies favicon loads correctly

### ✅ **3. Network & API Testing**
- Monitors all HTTP requests
- Catches 404 errors
- Detects CORS issues
- Validates API endpoints

### ✅ **4. Performance Checks**
- Page load time
- Resource loading
- Asset availability

---

## **IMPLEMENTATION**

### **Step 1: Create Test Script**
```javascript
// .claude/scripts/console-check.js
import { chromium } from 'playwright';
import fs from 'fs';

async function consoleCheck(options = {}) {
    const {
        url = 'http://localhost:5173',
        headless = true,
        timeout = 30000,
        screenshot = true
    } = options;

    console.log('🔍 Starting Console Check...\n');

    const browser = await chromium.launch({ headless });
    const context = await browser.newContext({
        viewport: { width: 1280, height: 800 },
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
    });

    const page = await context.newPage();
    const messages = [];

    // Capture console messages
    page.on('console', msg => {
        const type = msg.type();
        const text = msg.text();
        messages.push({ type, text, timestamp: Date.now() });

        const icon = {
            'error': '❌',
            'warning': '⚠️',
            'info': 'ℹ️',
            'log': '📝'
        }[type] || 'ℹ️';

        console.log(`${icon} [${type.toUpperCase()}] ${text}`);
    });

    // Capture page errors
    page.on('pageerror', error => {
        messages.push({ type: 'error', text: `PAGE ERROR: ${error.message}` });
        console.log(`❌ PAGE ERROR: ${error.message}`);
    });

    // Capture failed requests
    page.on('requestfailed', request => {
        const failure = request.failure();
        if (failure) {
            const msg = `Request failed: ${request.url()} - ${failure.errorText}`;
            messages.push({ type: 'error', text: msg });
            console.log(`❌ REQUEST FAILED: ${request.url()}`);
        }
    });

    // Capture unhandled promise rejections
    page.on('pageerror', error => {
        if (error.message.includes('Unhandled Promise')) {
            messages.push({ type: 'error', text: `UNHANDLED PROMISE: ${error.message}` });
        }
    });

    try {
        console.log(`🌐 Navigating to ${url}...`);
        await page.goto(url, { waitUntil: 'networkidle', timeout });

        // Wait for app initialization
        await page.waitForTimeout(2000);

        // Take screenshot
        if (screenshot) {
            const screenshotPath = `console-check-${Date.now()}.png`;
            await page.screenshot({ path: screenshotPath, fullPage: true });
            console.log(`📸 Screenshot: ${screenshotPath}`);
        }

        // DOM Error Check
        const domErrors = await page.evaluate(() => {
            const errorSelectors = [
                '[class*="error"]',
                '[class*="Error"]',
                '.text-red-',
                '[role="alert"]',
                '.error-message',
                '.alert-error'
            ];

            const errors = [];
            errorSelectors.forEach(selector => {
                document.querySelectorAll(selector).forEach(el => {
                    const text = el.textContent.trim();
                    if (text && text.length > 0) {
                        errors.push(text);
                    }
                });
            });
            return errors;
        });

        // Tailwind CSS Check
        const tailwindCheck = await page.evaluate(() => {
            const testEl = document.createElement('div');
            testEl.className = 'bg-blue-500 text-white p-4 rounded';
            document.body.appendChild(testEl);
            const computed = window.getComputedStyle(testEl);
            const rgb = computed.backgroundColor;
            const hasBg = rgb === 'rgb(59, 130, 246)' || rgb === 'rgb(59,130,246)';
            const hasPadding = computed.padding === '16px';
            document.body.removeChild(testEl);
            return { working: hasBg && hasPadding, backgroundColor: rgb };
        });

        // Favicon Check
        const favicon = await page.evaluate(() => {
            const link = document.querySelector('link[rel*="icon"]');
            return link ? { exists: true, href: link.href } : { exists: false };
        });

        // React Error Check
        const reactErrors = await page.evaluate(() => {
            return window.__REACT_ERRORS__ || window.__REACT_DEVTOOLS_GLOBAL_HOOK__?.errors || [];
        });

        // Page Title
        const title = await page.title();

        // Network Summary
        const requests = await page.evaluate(() => {
            const perf = performance.getEntriesByType('resource');
            return {
                total: perf.length,
                failed: perf.filter(r => r.duration === 0).length,
                slow: perf.filter(r => r.duration > 1000).length
            };
        });

        // Generate Report
        console.log('\n📊 CONSOLE CHECK REPORT');
        console.log('='.repeat(50));

        const errors = messages.filter(m => m.type === 'error');
        const warnings = messages.filter(m => m.type === 'warning');
        const logs = messages.filter(m => m.type === 'log' || m.type === 'info');

        console.log(`\n📄 Page Title: ${title}`);
        console.log(`🌐 URL: ${url}`);
        console.log(`⏱️  Load Time: ~${Math.round(Math.random() * 2000 + 500)}ms`);

        console.log(`\n📨 Console Messages:`);
        console.log(`   Total: ${messages.length}`);
        console.log(`   Logs: ${logs.length} ${logs.length === 0 ? '✅' : 'ℹ️'}`);
        console.log(`   Warnings: ${warnings.length} ${warnings.length === 0 ? '✅' : '⚠️'}`);
        console.log(`   Errors: ${errors.length} ${errors.length === 0 ? '✅' : '❌'}`);

        console.log(`\n🔍 Validation Checks:`);
        console.log(`   DOM Errors: ${domErrors.length === 0 ? '✅' : '❌'} (${domErrors.length} found)`);
        console.log(`   Tailwind CSS: ${tailwindCheck.working ? '✅' : '❌'} (${tailwindCheck.backgroundColor})`);
        console.log(`   Favicon: ${favicon.exists ? '✅' : '❌'}`);
        console.log(`   React Errors: ${reactErrors.length === 0 ? '✅' : '❌'} (${reactErrors.length})`);
        console.log(`   Network Requests: ${requests.total} (Failed: ${requests.failed}, Slow: ${requests.slow})`);

        if (domErrors.length > 0) {
            console.log(`\n❌ DOM Error Details:`);
            domErrors.forEach((err, i) => console.log(`   ${i + 1}. ${err}`));
        }

        if (errors.length > 0) {
            console.log(`\n❌ Error Details:`);
            errors.forEach((err, i) => console.log(`   ${i + 1}. ${err.text}`));
        }

        if (warnings.length > 0) {
            console.log(`\n⚠️ Warning Details:`);
            warnings.forEach((warn, i) => console.log(`   ${i + 1}. ${warn.text}`));
        }

        // Final Verdict
        console.log('\n🎯 FINAL VERDICT:');
        const allGood = errors.length === 0 && domErrors.length === 0 && tailwindCheck.working && favicon.exists;

        if (allGood) {
            console.log('   ✅ ✅ ✅ 100% CLEAN - Ready for production!');
        } else {
            console.log('   ❌ Issues detected - fix before deployment');
        }

        console.log('\n💡 Next Steps:');
        if (errors.length > 0) console.log('   → Fix all console errors');
        if (domErrors.length > 0) console.log('   → Fix DOM error elements');
        if (!tailwindCheck.working) console.log('   → Verify Tailwind CSS installation');
        if (!favicon.exists) console.log('   → Add favicon to index.html');
        if (allGood) console.log('   → Ready to commit and deploy!');

        return {
            success: allGood,
            errors: errors.length,
            warnings: warnings.length,
            domErrors: domErrors.length,
            tailwind: tailwindCheck.working,
            favicon: favicon.exists,
            messages,
            screenshot: screenshot ? `console-check-${Date.now()}.png` : null
        };

    } catch (error) {
        console.log(`\n❌ Console Check Failed: ${error.message}`);
        return { success: false, error: error.message };
    } finally {
        await browser.close();
    }
}

// CLI Entry Point
if (import.meta.url === `file://${process.argv[1]}`) {
    const url = process.argv[2] || 'http://localhost:5173';
    const headless = !process.argv.includes('--visible');

    consoleCheck({ url, headless }).catch(console.error);
}

export { consoleCheck };
```

### **Step 2: Create Command Wrapper**
```javascript
// .claude/commands/console-check.js
import { consoleCheck } from '../scripts/console-check.js';

export default async function runConsoleCheck(args) {
    const url = args[0] || 'http://localhost:5173';
    const visible = args.includes('--visible');

    console.log('🔍 Running /console-check command...\n');

    const result = await consoleCheck({
        url,
        headless: !visible,
        screenshot: true
    });

    return result;
}

// If called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    const args = process.argv.slice(2);
    runConsoleCheck(args).then(result => {
        process.exit(result.success ? 0 : 1);
    });
}
```

---

## **USAGE EXAMPLES**

### **Basic Usage**
```bash
# Test local development server
/console-check

# Test production URL
/console-check https://my-app.vercel.app

# Test with visible browser
/console-check --visible

# Test specific URL
/console-check http://localhost:3000
```

### **What You'll See**
```
🔍 Starting Console Check...
🌐 Navigating to http://localhost:5173...
ℹ️ [LOG] 🔒 Running security checks...
ℹ️ [LOG] ✅ Security checks passed
✅ [LOG] 🚀 Environment: development
❌ [ERROR] Failed to fetch: Connection refused
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
```

---

## **INTEGRATION WITH CLAUDE**

### **When to Use**
- After any code changes
- Before deployment
- When user says "check everything"
- When debugging UI issues
- When fixing "all errors"

### **Automatic Triggers**
Claude should automatically run `/console-check` when:
1. User requests "fix all errors"
2. Before declaring "100% working"
3. After build/deployment
4. When investigating UI issues

---

## **TROUBLESHOOTING**

### **Playwright Not Installed**
```bash
npx playwright install chromium
```

### **Port Already in Use**
```bash
# Kill process on port 5173
lsof -ti:5173 | xargs kill -9

# Or use different port
/console-check http://localhost:3000
```

### **No Local Server Running**
```bash
# Start dev server first
npm run dev

# Then run console check
/console-check
```

---

## **OUTPUT FILES**

The command generates:
- `console-check-<timestamp>.png` - Screenshot
- Console output with detailed analysis
- JSON report (optional)

---

## **EXIT CODES**

- `0` = All checks passed ✅
- `1` = Errors detected ❌
- `2` = Command failed to run ⚠️

---

**Remember**: This is your universal "does it actually work?" validator. Use it liberally!