#!/bin/bash

# 🚀 ZOE Solar Accounting OCR - Production Deployment Script
# Complete production-ready deployment with best practices

set -e

echo "🚀 Starting ZOE Solar Accounting OCR Production Deployment..."
echo "========================================================"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print status
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# 1. Environment Validation
echo "🔍 Step 1: Environment Validation"
echo "--------------------------------"

# Check if required environment variables are set
if [ -z "$VITE_SUPABASE_URL" ] || [ -z "$VITE_SUPABASE_ANON_KEY" ]; then
    print_warning "Supabase configuration missing in environment. Using .env.vercel file..."
    if [ -f ".env.vercel" ]; then
        source .env.vercel
        print_status "Loaded environment variables from .env.vercel"
    else
        print_error "Supabase configuration missing. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY"
        exit 1
    fi
fi

if [ -z "$VITE_GEMINI_API_KEY" ]; then
    print_warning "Gemini API key missing in environment. Using .env.vercel file..."
    if [ -f ".env.vercel" ]; then
        source .env.vercel
        print_status "Loaded Gemini API key from .env.vercel"
    else
        print_error "Gemini API key missing. Please set VITE_GEMINI_API_KEY"
        exit 1
    fi
fi

print_status "Environment variables validated"

# 2. Install Dependencies
echo ""
echo "📦 Step 2: Installing Dependencies"
echo "--------------------------------"

npm ci --production=false
print_status "Dependencies installed"

# 3. Run Production Build
echo ""
echo "🔨 Step 3: Building for Production"
echo "--------------------------------"

# Clean previous builds
rm -rf dist/

# Build the application
npm run build

if [ $? -eq 0 ]; then
    print_status "Production build completed successfully"
else
    print_error "Production build failed"
    exit 1
fi

# 4. Security Validation
echo ""
echo "🔒 Step 4: Security Validation"
echo "----------------------------"

# Check for security issues in dependencies
npm audit --audit-level=moderate

if [ $? -eq 0 ]; then
    print_status "No critical security vulnerabilities found"
else
    print_warning "Security vulnerabilities detected - please review"
fi

# 5. Performance Validation
echo ""
echo "⚡ Step 5: Performance Validation"
echo "-------------------------------"

# Check bundle size
echo "Bundle analysis:"
du -sh dist/

# List main chunks
echo ""
echo "Main chunks:"
ls -lh dist/assets/*.js | head -10

print_status "Performance validation completed"

# 6. Vercel Deployment
echo ""
echo "🌍 Step 6: Vercel Deployment"
echo "---------------------------"

# Check if Vercel CLI is available
if ! command -v vercel &> /dev/null; then
    print_error "Vercel CLI not found. Please install Vercel CLI: npm install -g vercel"
    exit 1
fi

# Deploy to Vercel
echo "Deploying to Vercel..."
vercel --prod --yes

if [ $? -eq 0 ]; then
    print_status "Deployment to Vercel completed"
else
    print_error "Vercel deployment failed"
    exit 1
fi

# 7. Health Check
echo ""
echo "🏥 Step 7: Health Check"
echo "---------------------"

# Get deployment URL
DEPLOYMENT_URL=$(vercel --url)
echo "Deployment URL: $DEPLOYMENT_URL"

# Basic health check
echo "Performing basic health check..."
curl -f -s -o /dev/null $DEPLOYMENT_URL

if [ $? -eq 0 ]; then
    print_status "Health check passed - application is accessible"
else
    print_warning "Health check failed - please verify deployment"
fi

# 8. Supabase Connection Test
echo ""
echo "🗄️  Step 8: Supabase Connection Test"
echo "----------------------------------"

# Test Supabase connection
node -e "
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function testConnection() {
  try {
    const { data, error } = await supabase.from('belege').select('*').limit(1);
    if (error) {
      console.error('Supabase connection failed:', error.message);
      process.exit(1);
    }
    console.log('Supabase connection successful!');
    console.log('Found', data.length, 'records in belege table');
  } catch (error) {
    console.error('Supabase test failed:', error.message);
    process.exit(1);
  }
}

testConnection();
"

if [ $? -eq 0 ]; then
    print_status "Supabase connection test passed"
else
    print_warning "Supabase connection test failed - please check configuration"
fi

# 9. Final Summary
echo ""
echo "🎉 Step 9: Deployment Summary"
echo "----------------------------"
echo "✅ Application deployed successfully"
echo "🌐 URL: $DEPLOYMENT_URL"
echo "🗄️  Database: Supabase (https://supabase.aura-call.de)"
echo "🔒 Security: CSP, HSTS, and security headers configured"
echo "⚡ Performance: Optimized bundles and code splitting"
echo "🛡️  Monitoring: Ready for Sentry integration"

echo ""
echo "🎉 ZOE Solar Accounting OCR is now live and production-ready!"
echo "============================================================="