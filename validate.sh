#!/bin/bash

# 🎯 Universal Project Validation Script
# Usage: ./validate.sh [url]
# This script performs comprehensive validation of any project

set -e

echo "🔍 🔍 🔍  UNIVERSAL PROJECT VALIDATION  🔍 🔍 🔍"
echo "=================================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if package.json exists
if [ ! -f "package.json" ]; then
    print_error "No package.json found. This doesn't look like a Node.js project."
    exit 1
fi

# Get project name from package.json
PROJECT_NAME=$(node -p "require('./package.json').name" 2>/dev/null || echo "Unknown")
print_info "Project: $PROJECT_NAME"

# ============================================
# PHASE 1: BUILD & TYPE CHECK
# ============================================
echo ""
echo "📦 Phase 1: Build & Type Checking"
echo "----------------------------------"

# Check if build script exists
if grep -q '"build"' package.json; then
    print_info "Running build..."
    if npm run build > /tmp/build.log 2>&1; then
        print_success "Build successful"
    else
        print_error "Build failed"
        cat /tmp/build.log
        exit 1
    fi
else
    print_warning "No build script found"
fi

# TypeScript check
if command -v npx &> /dev/null; then
    print_info "Checking TypeScript..."
    if npx tsc --noEmit > /tmp/typescript.log 2>&1; then
        print_success "TypeScript: 0 errors"
    else
        print_error "TypeScript errors found"
        cat /tmp/typescript.log
        exit 1
    fi
fi

# ============================================
# PHASE 2: LINTING
# ============================================
echo ""
echo "🔍 Phase 2: Code Quality (ESLint)"
echo "----------------------------------"

if grep -q '"lint"' package.json; then
    print_info "Running ESLint..."
    if npm run lint > /tmp/lint.log 2>&1; then
        print_success "ESLint: 0 errors"
    else
        # Check if it's just warnings
        if grep -q "0 errors" /tmp/lint.log; then
            print_warning "ESLint warnings found (0 errors)"
            grep "warning" /tmp/lint.log | head -5
        else
            print_error "ESLint errors found"
            cat /tmp/lint.log
            exit 1
        fi
    fi
else
    print_warning "No lint script found"
fi

# ============================================
# PHASE 3: TESTS
# ============================================
echo ""
echo "🧪 Phase 3: Testing"
echo "-------------------"

if grep -q '"test"' package.json; then
    print_info "Running tests..."
    if npm test > /tmp/test.log 2>&1; then
        print_success "All tests passed"
    else
        print_error "Tests failed"
        cat /tmp/test.log
        exit 1
    fi
else
    print_warning "No test script found"
fi

# ============================================
# PHASE 4: WEB APP CHECKS
# ============================================
echo ""
echo "🌐 Phase 4: Web Application Checks"
echo "-----------------------------------"

# Check if this is a web application
if [ -f "index.html" ] || [ -f "src/index.tsx" ] || [ -f "src/App.tsx" ]; then
    print_info "Web application detected"

    # Check for favicon
    if grep -q "favicon" index.html 2>/dev/null || grep -q "favicon" src/index.html 2>/dev/null; then
        print_success "Favicon found"
    else
        print_warning "No favicon found (add to index.html)"
    fi

    # Check for Tailwind
    if [ -f "tailwind.config.js" ] || grep -q "tailwind" package.json; then
        print_info "Tailwind CSS detected"
        if [ -f "vite.config.ts" ] && grep -q "tailwind" vite.config.ts; then
            print_success "Tailwind plugin configured"
        else
            print_warning "Verify Tailwind plugin in config"
        fi
    fi

    # Check for visual test script
    if [ -f "test-visual.js" ]; then
        print_info "Visual test script found"
        if command -v node &> /dev/null; then
            print_warning "Run: node test-visual.js for visual validation"
        fi
    else
        print_warning "No visual test script (create test-visual.js)"
    fi

    # Check for console-check command
    if [ -f ".claude/commands/console-check.js" ]; then
        print_success "/console-check command available"
        print_info "Run: node .claude/commands/console-check.js"
    fi
else
    print_info "Not a web application (skipping web checks)"
fi

# ============================================
# PHASE 5: SECURITY & DEPENDENCIES
# ============================================
echo ""
echo "🔒 Phase 5: Security & Dependencies"
echo "------------------------------------"

# Check for security vulnerabilities
if command -v npm &> /dev/null; then
    print_info "Checking for vulnerabilities..."
    if npm audit --audit-level=moderate > /tmp/audit.log 2>&1; then
        print_success "No critical vulnerabilities"
    else
        print_warning "Vulnerabilities found (check npm audit)"
        grep "severity" /tmp/audit.log | head -5
    fi
fi

# Check for outdated packages
if command -v npm &> /dev/null; then
    print_info "Checking for outdated packages..."
    npm outdated > /tmp/outdated.log 2>&1 || true
    if [ -s /tmp/outdated.log ]; then
        print_warning "Some packages are outdated"
        cat /tmp/outdated.log
    else
        print_success "All packages up to date"
    fi
fi

# ============================================
# PHASE 6: ENVIRONMENT CHECK
# ============================================
echo ""
echo "⚙️  Phase 6: Environment Configuration"
echo "---------------------------------------"

# Check for .env.example
if [ -f ".env.example" ]; then
    print_success ".env.example exists"
    # Count required variables
    VAR_COUNT=$(grep -c "^[A-Z]" .env.example 2>/dev/null || echo "0")
    print_info "Required variables: $VAR_COUNT"
else
    print_warning "No .env.example file (create one)"
fi

# Check for .env file
if [ -f ".env" ]; then
    print_success ".env file exists"
else
    print_warning ".env file not found (create from .env.example)"
fi

# ============================================
# PHASE 7: CLAUDE CONFIGURATION
# ============================================
echo ""
echo "🤖 Phase 7: Claude Configuration"
echo "---------------------------------"

if [ -d ".claude" ]; then
    print_success ".claude directory exists"

    if [ -f ".claude/claude-config.md" ]; then
        print_success "Claude config found"
    fi

    if [ -f ".claude/universal-testing-instructions.md" ]; then
        print_success "Universal instructions found"
    fi

    if [ -f ".claude/commands/console-check.js" ]; then
        print_success "/console-check command ready"
    fi
else
    print_warning "No .claude directory (run: mkdir -p .claude/commands)"
fi

# ============================================
# FINAL SUMMARY
# ============================================
echo ""
echo "📊 FINAL VALIDATION SUMMARY"
echo "============================"
echo ""

# Count results
BUILD_OK=$(grep -c "✅ Build successful" /tmp/build.log 2>/dev/null || echo "0")
TS_OK=$(grep -c "✅ TypeScript" /tmp/typescript.log 2>/dev/null || echo "0")
LINT_OK=$(grep -c "✅ ESLint" /tmp/lint.log 2>/dev/null || echo "0")
TEST_OK=$(grep -c "✅ All tests" /tmp/test.log 2>/dev/null || echo "0")

echo "Build:        $([ $BUILD_OK -gt 0 ] && echo '✅' || echo '⚠️ ')"
echo "TypeScript:   $([ $TS_OK -gt 0 ] && echo '✅' || echo '⚠️ ')"
echo "ESLint:       $([ $LINT_OK -gt 0 ] && echo '✅' || echo '⚠️ ')"
echo "Tests:        $([ $TEST_OK -gt 0 ] && echo '✅' || echo '⚠️ ')"
echo ""

# Check if all critical checks passed
if [ $BUILD_OK -gt 0 ] && [ $TS_OK -gt 0 ] && [ $LINT_OK -gt 0 ]; then
    echo -e "${GREEN}🎉 ALL CRITICAL CHECKS PASSED!${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. Run visual test: node test-visual.js"
    echo "  2. Run console check: node .claude/commands/console-check.js"
    echo "  3. Commit changes: git add . && git commit -m 'chore: validation complete'"
    echo ""
    exit 0
else
    echo -e "${RED}❌ Some checks failed. Fix issues before proceeding.${NC}"
    echo ""
    exit 1
fi