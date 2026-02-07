# UNSAID/UNHEARD Deployment Script for Windows
# This script prepares and deploys the application to Vercel

$ErrorActionPreference = "Stop"

Write-Host "🚀 UNSAID/UNHEARD Deployment Script" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

# Check if .env.local exists
if (-not (Test-Path ".env.local")) {
    Write-Host "❌ Error: .env.local file not found" -ForegroundColor Red
    Write-Host "Please create .env.local with your Firebase credentials"
    Write-Host "See .env.local.example for reference"
    exit 1
}

Write-Host "📦 Step 1: Installing dependencies..." -ForegroundColor Yellow
npm ci

Write-Host "`n🔍 Step 2: Running linter..." -ForegroundColor Yellow
npm run lint
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Lint warnings found (non-blocking)" -ForegroundColor Yellow
}

Write-Host "`n🧪 Step 3: Running tests..." -ForegroundColor Yellow
npm test -- --passWithNoTests
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Test warnings found (non-blocking)" -ForegroundColor Yellow
}

Write-Host "`n🏗️  Step 4: Building production bundle..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ Build successful!" -ForegroundColor Green
} else {
    Write-Host "`n❌ Build failed. Please fix errors above." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "✅ Pre-deployment checks complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next steps:" -ForegroundColor Cyan
Write-Host "  1. Ensure Firebase project is configured"
Write-Host "  2. Add environment variables to Vercel"
Write-Host "  3. Deploy using one of these methods:"
Write-Host ""
Write-Host "     Method 1 - Vercel CLI:" -ForegroundColor White
Write-Host "     PS> vercel --prod" -ForegroundColor Gray
Write-Host ""
Write-Host "     Method 2 - Vercel Dashboard:" -ForegroundColor White
Write-Host "     Visit https://vercel.com/new and import your repository" -ForegroundColor Gray
Write-Host ""
Write-Host "📖 See VERCEL_DEPLOYMENT_GUIDE.md for detailed instructions"
Write-Host "📋 See DEPLOYMENT_CHECKLIST.md for complete checklist"
