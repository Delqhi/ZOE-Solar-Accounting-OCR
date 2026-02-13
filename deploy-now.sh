#!/bin/bash
# 🚀 ZOE Deployment Quick-Start Script
# One-command deployment to Vercel

set -e

echo "🚀 ZOE Solar Accounting OCR - Quick Deployment"
echo "=============================================="

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo -e "${YELLOW}📦 Installing Vercel CLI...${NC}"
    npm install -g vercel@latest
fi

# Check for existing .vercel directory
if [ -d ".vercel" ]; then
    echo -e "${YELLOW}🧹 Cleaning up existing .vercel directory...${NC}"
    rm -rf .vercel
fi

echo ""
echo -e "${YELLOW}📋 DEPLOYMENT OPTIONS:${NC}"
echo ""
echo "1. 🚀 Quick Deploy (Vercel CLI)"
echo "   - Requires: VERCEL_TOKEN, VERCEL_ORG_ID, VERCEL_PROJECT_ID"
echo "   - Time: ~5 minutes"
echo ""
echo "2. 🌐 Vercel Dashboard"
echo "   - No CLI required"
echo "   - Time: ~3 minutes"
echo "   - Link: https://vercel.com/dashboard"
echo ""
echo "3. 🔐 GitHub Secrets Setup"
echo "   - Permanent solution"
echo "   - Time: ~10 minutes"
echo "   - Enables automatic deployments"
echo ""

read -p "Choose option (1, 2, or 3): " choice

case $choice in
    1)
        echo ""
        echo -e "${GREEN}Option 1: Quick Deploy via Vercel CLI${NC}"
        echo ""

        # Check for environment variables
        if [ -z "$VERCEL_TOKEN" ]; then
            echo -e "${RED}❌ VERCEL_TOKEN not set${NC}"
            echo "Please set it first:"
            echo "export VERCEL_TOKEN=\"your-vercel-token\""
            echo ""
            echo "Get token from: https://vercel.com/account/tokens"
            exit 1
        fi

        if [ -z "$VERCEL_ORG_ID" ]; then
            echo -e "${RED}❌ VERCEL_ORG_ID not set${NC}"
            echo "Using default: team_VTipbYr7L5qhqXdu38e0Z0OL"
            export VERCEL_ORG_ID="team_VTipbYr7L5qhqXdu38e0Z0OL"
        fi

        if [ -z "$VERCEL_PROJECT_ID" ]; then
            echo -e "${RED}❌ VERCEL_PROJECT_ID not set${NC}"
            echo "Using default: prj_mZIqzJ5k65Di3pQF1Ge9UXCWtjxf"
            export VERCEL_PROJECT_ID="prj_mZIqzJ5k65Di3pQF1Ge9UXCWtjxf"
        fi

        echo -e "${YELLOW}🔗 Linking to Vercel project...${NC}"
        vercel link --yes --token=$VERCEL_TOKEN --scope=$VERCEL_ORG_ID

        echo ""
        echo -e "${YELLOW}🚀 Deploying to production...${NC}"
        vercel deploy --prod --token=$VERCEL_TOKEN

        echo ""
        echo -e "${GREEN}✅ Deployment complete!${NC}"
        echo ""
        echo "Next steps:"
        echo "1. Open Chrome DevTools (F12)"
        echo "2. Navigate to deployed URL"
        echo "3. Test file upload"
        echo "4. Check console logs"
        ;;

    2)
        echo ""
        echo -e "${GREEN}Option 2: Vercel Dashboard${NC}"
        echo ""
        echo "Steps:"
        echo "1. Go to: https://vercel.com/dashboard"
        echo "2. Click 'Add New Project'"
        echo "3. Import GitHub repo: zoe-solar-accounting-ocr"
        echo "4. Configure:"
        echo "   - Framework Preset: Vite"
        echo "   - Build Command: npm run build"
        echo "   - Output Directory: dist"
        echo "   - Install Command: npm ci"
        echo ""
        echo "5. Add Environment Variables:"
        echo "   - VITE_SUPABASE_URL"
        echo "   - VITE_SUPABASE_ANON_KEY"
        echo "   - VITE_GEMINI_API_KEY"
        echo "   - VITE_SILICONFLOW_API_KEY"
        echo ""
        echo "6. Click 'Deploy'"
        echo ""
        echo "Expected deployment time: ~2 minutes"
        ;;

    3)
        echo ""
        echo -e "${GREEN}Option 3: GitHub Secrets Setup (Permanent)${NC}"
        echo ""
        echo "Step 1: Generate Vercel Token"
        echo "1. Go to: https://vercel.com/account/tokens"
        echo "2. Click 'Create Token'"
        echo "3. Name: GITHUB_ACTIONS_TOKEN"
        echo "4. Copy the token (starts with vercel_token_)"
        echo ""
        echo "Step 2: Add to GitHub Secrets"
        echo "1. Go to GitHub → Repository → Settings → Secrets → Actions"
        echo "2. Click 'New repository secret'"
        echo "3. Add these secrets:"
        echo ""
        echo "   Name: VERCEL_TOKEN"
        echo "   Value: [your-token]"
        echo ""
        echo "   Name: VERCEL_ORG_ID"
        echo "   Value: team_VTipbYr7L5qhqXdu38e0Z0OL"
        echo ""
        echo "   Name: VERCEL_PROJECT_ID"
        echo "   Value: prj_mZIqzJ5k65Di3pQF1Ge9UXCWtjxf"
        echo ""
        echo "   Name: VITE_SUPABASE_URL"
        echo "   Value: [your-supabase-url]"
        echo ""
        echo "   Name: VITE_SUPABASE_ANON_KEY"
        echo "   Value: [your-supabase-anon-key]"
        echo ""
        echo "   Name: VITE_GEMINI_API_KEY"
        echo "   Value: [your-gemini-key]"
        echo ""
        echo "   Name: VITE_SILICONFLOW_API_KEY"
        echo "   Value: [your-siliconflow-key]"
        echo ""
        echo "Step 3: Trigger Deployment"
        echo "git commit --allow-empty -m \"Trigger deployment with secrets\""
        echo "git push origin main"
        echo ""
        echo "Expected deployment time: ~75 seconds"
        ;;

    *)
        echo -e "${RED}❌ Invalid option${NC}"
        echo "Please choose 1, 2, or 3"
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}📚 Documentation Available:${NC}"
echo "   - DEPLOYMENT_SUMMARY.md - Complete overview"
echo "   - DEPLOYMENT_VERIFICATION_CHECKLIST.md - Testing steps"
echo "   - MANUAL_DEPLOYMENT_COMPLETE.md - Detailed instructions"
echo "   - CHROME_CONSOLE_SIMULATION.md - Expected logs"
echo "   - LOG_SUMMARY.md - Quick reference"
echo ""
echo -e "${GREEN}🎯 Next: Test the deployment and check Chrome console logs!${NC}"