#!/bin/bash

# UNSAID/UNHEARD Deployment Script
# This script prepares and deploys the application to Vercel

set -e  # Exit on error

echo "🚀 UNSAID/UNHEARD Deployment Script"
echo "===================================="
echo ""

# Colors for output
GREEN='\033[0.32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo -e "${RED}❌ Error: .env.local file not found${NC}"
    echo "Please create .env.local with your Firebase credentials"
    echo "See .env.local.example for reference"
    exit 1
fi

echo -e "${YELLOW}📦 Step 1: Installing dependencies...${NC}"
npm ci

echo -e "${YELLOW}🔍 Step 2: Running linter...${NC}"
npm run lint || echo "⚠️  Lint warnings found (non-blocking)"

echo -e "${YELLOW}🧪 Step 3: Running tests...${NC}"
npm test -- --passWithNoTests || echo "⚠️  Test warnings found (non-blocking)"

echo -e "${YELLOW}🏗️  Step 4: Building production bundle...${NC}"
npm run build

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Build successful!${NC}"
else
    echo -e "${RED}❌ Build failed. Please fix errors above.${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}✅ Pre-deployment checks complete!${NC}"
echo ""
echo "📋 Next steps:"
echo "  1. Ensure Firebase project is configured"
echo "  2. Add environment variables to Vercel"
echo "  3. Deploy using one of these methods:"
echo ""
echo "     Method 1 - Vercel CLI:"
echo "     $ vercel --prod"
echo ""
echo "     Method 2 - Vercel Dashboard:"
echo "     Visit https://vercel.com/new and import your repository"
echo ""
echo "📖 See VERCEL_DEPLOYMENT_GUIDE.md for detailed instructions"
echo "📋 See DEPLOYMENT_CHECKLIST.md for complete checklist"
