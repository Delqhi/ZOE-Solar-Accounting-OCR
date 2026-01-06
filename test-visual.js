#!/usr/bin/env node

/**
 * Visual Testing Script for ZOE Solar Accounting OCR
 * Tests the deployed application with real browser console logs
 */

import { chromium } from 'playwright';
import fs from 'fs';

async function testDeployedApp() {
    console.log('🚀 Starting visual test of deployed application...\n');

    const browser = await chromium.launch({
        headless: false, // Set to true for CI, false to see browser
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const context = await browser.newContext({
        viewport: { width: 1280, height: 800 },
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });

    const page = await context.newPage();

    // Capture all console messages
    const consoleMessages = [];
    page.on('console', msg => {
        const type = msg.type();
        const text = msg.text();
        consoleMessages.push({ type, text });

        const icon = type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️';
        console.log(`${icon} [${type.toUpperCase()}] ${text}`);
    });

    // Capture page errors
    page.on('pageerror', error => {
        console.log('❌ PAGE ERROR:', error.message);
        consoleMessages.push({ type: 'error', text: error.message });
    });

    // Capture requests that fail
    page.on('requestfailed', request => {
        const failure = request.failure();
        if (failure) {
            console.log('❌ REQUEST FAILED:', request.url(), failure.errorText);
            consoleMessages.push({ type: 'error', text: `Request failed: ${request.url()} - ${failure.errorText}` });
        }
    });

    try {
        console.log('🌐 Navigating to https://zoe-solar-accounting-ocr.vercel.app...');
        await page.goto('https://zoe-solar-accounting-ocr.vercel.app', {
            waitUntil: 'networkidle',
            timeout: 30000
        });

        console.log('✅ Page loaded successfully');

        // Wait for app to be ready
        await page.waitForTimeout(2000);

        // Take screenshot
        await page.screenshot({
            path: '/Users/jeremy/conductor/repos/zoe-solar-accounting-ocr/visual-test-screenshot.png',
            fullPage: true
        });
        console.log('📸 Screenshot saved: visual-test-screenshot.png');

        // Check for favicon
        const favicon = await page.evaluate(() => {
            const link = document.querySelector('link[rel*="icon"]');
            return link ? link.href : 'No favicon found';
        });
        console.log('🎨 Favicon:', favicon);

        // Check page title
        const title = await page.title();
        console.log('📄 Page Title:', title);

        // Check for any visible errors in DOM
        const errorsInDOM = await page.evaluate(() => {
            const errorElements = document.querySelectorAll('[class*="error"], [class*="Error"], .text-red-');
            return Array.from(errorElements).map(el => el.textContent.trim()).filter(t => t.length > 0);
        });

        if (errorsInDOM.length > 0) {
            console.log('❌ Visible errors in DOM:', errorsInDOM);
        } else {
            console.log('✅ No visible errors in DOM');
        }

        // Check for Tailwind classes being applied
        const tailwindCheck = await page.evaluate(() => {
            const testEl = document.createElement('div');
            testEl.className = 'bg-blue-500';
            document.body.appendChild(testEl);
            const computed = window.getComputedStyle(testEl);
            const hasBg = computed.backgroundColor === 'rgb(59, 130, 246)';
            document.body.removeChild(testEl);
            return hasBg;
        });
        console.log('🎨 Tailwind CSS working:', tailwindCheck ? '✅' : '❌');

        // Summary
        console.log('\n📊 TEST SUMMARY:');
        console.log('================');
        console.log(`Total Console Messages: ${consoleMessages.length}`);

        const errors = consoleMessages.filter(m => m.type === 'error');
        const warnings = consoleMessages.filter(m => m.type === 'warning');

        console.log(`Errors: ${errors.length} ${errors.length === 0 ? '✅' : '❌'}`);
        console.log(`Warnings: ${warnings.length} ${warnings.length === 0 ? '✅' : '⚠️'}`);

        if (errors.length > 0) {
            console.log('\n❌ Error Details:');
            errors.forEach(e => console.log(`  - ${e.text}`));
        }

        if (warnings.length > 0) {
            console.log('\n⚠️ Warning Details:');
            warnings.forEach(w => console.log(`  - ${w.text}`));
        }

        // Test basic interaction
        console.log('\n🧪 Testing basic interactions...');

        // Check if upload area exists
        const uploadArea = await page.$('input[type="file"]');
        if (uploadArea) {
            console.log('✅ Upload area found');
        } else {
            console.log('❌ Upload area not found');
        }

        // Check for any React errors
        const reactErrors = await page.evaluate(() => {
            return window.__REACT_ERRORS__ || [];
        });

        if (reactErrors.length > 0) {
            console.log('❌ React Errors:', reactErrors);
        } else {
            console.log('✅ No React errors detected');
        }

        console.log('\n🎉 Visual test completed!');
        console.log('If you see the browser window, you can interact with it manually.');
        console.log('Close the browser window when done.');

        // Keep browser open for manual inspection if headless=false
        if (!process.argv.includes('--headless')) {
            console.log('\n⏰ Browser will remain open for 60 seconds for manual inspection...');
            await page.waitForTimeout(60000);
        }

    } catch (error) {
        console.log('❌ Test failed:', error.message);
    } finally {
        await browser.close();
    }
}

// Run if called directly
testDeployedApp().catch(console.error);