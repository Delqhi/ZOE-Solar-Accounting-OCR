#!/bin/bash
# 🚀 ZOE Manual Deployment Script
# Bypasses GitHub Actions workflow issues

set -e

echo "🔒 ZOE Solar Accounting OCR - Manual Deployment"
echo "================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check environment variables
echo -e "${YELLOW}📋 Checking environment variables...${NC}"
if [ -z "$VERCEL_TOKEN" ]; then
    echo -e "${RED}❌ VERCEL_TOKEN not set${NC}"
    exit 1
fi
if [ -z "$VERCEL_ORG_ID" ]; then
    echo -e "${RED}❌ VERCEL_ORG_ID not set${NC}"
    exit 1
fi
if [ -z "$VERCEL_PROJECT_ID" ]; then
    echo -e "${RED}❌ VERCEL_PROJECT_ID not set${NC}"
    exit 1
fi
echo -e "${GREEN}✅ All environment variables set${NC}"

# Install Vercel CLI
echo -e "${YELLOW}📦 Installing Vercel CLI...${NC}"
npm install -g vercel@latest
echo -e "${GREEN}✅ Vercel CLI installed${NC}"

# Remove any existing .vercel directory
echo -e "${YELLOW}🧹 Cleaning up .vercel directory...${NC}"
rm -rf .vercel
echo -e "${GREEN}✅ Cleaned up${NC}"

# Link to Vercel project
echo -e "${YELLOW}🔗 Linking to Vercel project...${NC}"
vercel link --yes --token=$VERCEL_TOKEN --scope=$VERCEL_ORG_ID
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to link to Vercel project${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Successfully linked to project${NC}"

# Deploy to production
echo -e "${YELLOW}🚀 Deploying to production...${NC}"
vercel deploy --prod --token=$VERCEL_TOKEN
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Deployment failed${NC}"
    exit 1
fi

echo -e "${GREEN}🎉 Deployment successful!${NC}"
echo ""
echo "📊 Next steps:"
echo "   1. Open Chrome DevTools (F12)"
echo "   2. Navigate to: https://zoe-solar-accounting-ocr.vercel.app"
echo "   3. Check Console tab for logs"
echo "   4. Test file upload workflow"
echo ""
echo "📝 Documentation available in:"
echo "   - LOG_SUMMARY.md"
echo "   - CHROME_CONSOLE_SIMULATION.md"
echo "   - VERCEL_DEPLOYMENT_LOGS.md"