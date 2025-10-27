#!/bin/bash

# AI Ad Yuugen Package Publishing Script
# This script publishes all packages to npm in the correct order

set -e

echo "📦 Publishing AI Ad Yuugen packages to npm..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Check if logged in to npm
if ! npm whoami &> /dev/null; then
    print_error "Not logged in to npm"
    echo "Please run: npm login"
    exit 1
fi

print_status "Logged in to npm as $(npm whoami)"

# Check if packages are built
if [ ! -d "packages/types/dist" ]; then
    print_error "Packages not built. Run 'npm run build' first"
    exit 1
fi

# Dry run option
DRY_RUN=false
if [ "$1" == "--dry-run" ]; then
    DRY_RUN=true
    print_warning "Running in dry-run mode (no actual publishing)"
fi

# Function to publish a package
publish_package() {
    local package_path=$1
    local package_name=$(node -p "require('./$package_path/package.json').name")
    local package_version=$(node -p "require('./$package_path/package.json').version")
    
    echo ""
    echo "Publishing $package_name@$package_version..."
    
    cd $package_path
    
    if [ "$DRY_RUN" = true ]; then
        npm publish --dry-run --access public
    else
        npm publish --access public
    fi
    
    cd - > /dev/null
    
    print_status "Published $package_name@$package_version"
}

# Publish packages in dependency order
echo ""
echo "Publishing packages in dependency order..."

# 1. Types (no dependencies)
publish_package "packages/types"

# 2. SDK (depends on types)
publish_package "packages/sdk"

# 3. ADCP Client (depends on types)
publish_package "packages/adcp-client"

# 4. Server (depends on types)
publish_package "packages/server"

# 5. UI Components (depends on types and sdk)
publish_package "packages/ui-components"

# 6. Developer Portal (depends on types, sdk, ui-components)
publish_package "packages/developer-portal"

# Summary
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ "$DRY_RUN" = true ]; then
    echo -e "${GREEN}✓ Dry run complete!${NC}"
else
    echo -e "${GREEN}✓ All packages published successfully!${NC}"
fi
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Verify packages at:"
echo "  https://www.npmjs.com/package/@ai-yuugen/types"
echo "  https://www.npmjs.com/package/@ai-yuugen/sdk"
echo "  https://www.npmjs.com/package/@ai-yuugen/adcp-client"
echo "  https://www.npmjs.com/package/@ai-yuugen/server"
echo "  https://www.npmjs.com/package/@ai-yuugen/ui-components"
echo "  https://www.npmjs.com/package/@ai-yuugen/developer-portal"
echo ""
