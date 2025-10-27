#!/bin/bash

# AI Ad Yuugen Release Preparation Script
# This script prepares the project for release by:
# 1. Running all tests
# 2. Building all packages
# 3. Validating package versions
# 4. Creating release artifacts

set -e

echo "🚀 Preparing AI Ad Yuugen for release..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Check if we're on main branch
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ]; then
    print_warning "Not on main branch (current: $CURRENT_BRANCH)"
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Check for uncommitted changes
if [[ -n $(git status -s) ]]; then
    print_error "Uncommitted changes detected"
    git status -s
    exit 1
fi

print_status "Working directory is clean"

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm ci
print_status "Dependencies installed"

# Run linting
echo ""
echo "🔍 Running linting..."
npm run lint
print_status "Linting passed"

# Run type checking
echo ""
echo "📝 Running type checks..."
npx nx run-many -t build --configuration=production
print_status "Type checking passed"

# Run unit tests
echo ""
echo "🧪 Running unit tests..."
npm run test
print_status "Unit tests passed"

# Run E2E tests
echo ""
echo "🎭 Running E2E tests..."
cd e2e && npm ci && cd ..
npm run test:e2e
print_status "E2E tests passed"

# Build all packages
echo ""
echo "🏗️  Building all packages..."
npm run build
print_status "All packages built successfully"

# Validate package versions
echo ""
echo "📋 Validating package versions..."
node -e "
const fs = require('fs');
const packages = [
  'packages/types',
  'packages/sdk',
  'packages/server',
  'packages/ui-components',
  'packages/developer-portal',
  'packages/adcp-client'
];

console.log('Package versions:');
packages.forEach(pkg => {
  const pkgJson = JSON.parse(fs.readFileSync(\`\${pkg}/package.json\`, 'utf8'));
  console.log(\`  \${pkgJson.name}: v\${pkgJson.version}\`);
});
"
print_status "Package versions validated"

# Check bundle sizes
echo ""
echo "📊 Checking bundle sizes..."
echo "SDK: $(du -sh packages/sdk/dist | cut -f1)"
echo "UI Components: $(du -sh packages/ui-components/dist | cut -f1)"
echo "ADCP Client: $(du -sh packages/adcp-client/dist | cut -f1)"
echo "Server: $(du -sh packages/server/dist | cut -f1)"
print_status "Bundle sizes checked"

# Generate documentation
echo ""
echo "📚 Building documentation..."
npm run build:docs
print_status "Documentation built"

# Create release artifacts
echo ""
echo "📦 Creating release artifacts..."
mkdir -p release
tar -czf release/ai-yuugen-sdk.tar.gz packages/sdk/dist
tar -czf release/ai-yuugen-ui-components.tar.gz packages/ui-components/dist
tar -czf release/ai-yuugen-server.tar.gz packages/server/dist
tar -czf release/ai-yuugen-adcp-client.tar.gz packages/adcp-client/dist
tar -czf release/ai-yuugen-docs.tar.gz docs
print_status "Release artifacts created in ./release/"

# Summary
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✓ Release preparation complete!${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Next steps:"
echo "  1. Review CHANGELOG.md"
echo "  2. Update version numbers if needed"
echo "  3. Create git tag: git tag -a v1.0.0 -m 'Release v1.0.0'"
echo "  4. Push tag: git push origin v1.0.0"
echo "  5. GitHub Actions will handle the rest!"
echo ""
