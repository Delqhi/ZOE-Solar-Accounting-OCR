#!/bin/bash

# 🚀 FIX SUPABASE CONNECTION & REDEPLOY
# Issue: Vercel has wrong Supabase URL (localhost:8000 instead of https://supabase.aura-call.de)
# Solution: Update environment variables and redeploy

set -e  # Exit on error

echo "════════════════════════════════════════════════════════════"
echo "🚀 ZOE Solar Accounting OCR - Supabase Fix & Deploy"
echo "════════════════════════════════════════════════════════════"
echo ""

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "⚠️  Vercel CLI not found. Installing..."
    npm install -g vercel@latest
fi

# Check if user is logged in
if ! vercel whoami &> /dev/null; then
    echo "❌ Please log in to Vercel first:"
    echo "   Run: vercel login"
    echo "   Then run this script again"
    exit 1
fi

echo "✅ Vercel CLI is ready"
echo ""

# Get credentials from SUPABASE_SECRETS.md
echo "📋 Reading Supabase credentials..."
SUPABASE_URL="https://supabase.aura-call.de"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIn0.oqN5J2n6GBoLIf3OpsUrK2OZWIAINIWcbmRV0mtA4yQ"

echo "   URL: $SUPABASE_URL"
echo "   Key: ${SUPABASE_ANON_KEY:0:20}..."
echo ""

# Remove old .vercel directory (causes linking issues)
if [ -d ".vercel" ]; then
    echo "🗑️  Removing old .vercel directory..."
    rm -rf .vercel
fi

# Link to Vercel project
echo "🔗 Linking to Vercel project..."
vercel link --yes --scope=team_VTipbYr7L5qhqXdu38e0Z0OL

# Update environment variables
echo "⚙️  Updating environment variables in Vercel..."
vercel env add VITE_SUPABASE_URL production <<< "$SUPABASE_URL"
vercel env add VITE_SUPABASE_ANON_KEY production <<< "$SUPABASE_ANON_KEY"

# Verify environment variables
echo ""
echo "✅ Verifying environment variables..."
vercel env ls

echo ""
echo "🚀 Deploying to production..."
vercel deploy --prod

echo ""
echo "════════════════════════════════════════════════════════════"
echo "✅ DEPLOYMENT COMPLETE"
echo "════════════════════════════════════════════════════════════"
echo ""
echo "Next steps:"
echo "1. Open your deployed app"
echo "2. Check Chrome Console (F12) for logs"
echo "3. Verify documents load correctly"
echo ""
echo "Expected console output:"
echo "   🔒 Running security checks..."
echo "   ✅ Environment variables validated"
echo "   🔄 Initializing application..."
echo "   📊 Found X documents"
echo ""
echo "If documents still don't load, run:"
echo "   node test-supabase-connection.js"
echo ""
