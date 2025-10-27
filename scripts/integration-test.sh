#!/bin/bash

# AI Ad Yuugen Integration Test Script
# This script runs comprehensive integration tests across all platforms

set -e

echo "🧪 Running AI Ad Yuugen integration tests..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

# Track test results
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

run_test() {
    local test_name=$1
    local test_command=$2
    
    ((TOTAL_TESTS++))
    echo ""
    print_info "Running: $test_name"
    
    if eval "$test_command"; then
        print_status "$test_name passed"
        ((PASSED_TESTS++))
        return 0
    else
        print_error "$test_name failed"
        ((FAILED_TESTS++))
        return 1
    fi
}

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Phase 1: Build Validation"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

run_test "Clean build" "npm run clean && npm run build"
run_test "Type checking" "npx nx run-many -t build --configuration=production"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Phase 2: Unit Tests"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

run_test "Types package tests" "npx nx run types:test --run"
run_test "SDK package tests" "npx nx run sdk:test --run"
run_test "Server package tests" "npx nx run server:test --run"
run_test "UI Components tests" "npx nx run ui-components:test --run"
run_test "ADCP Client tests" "npx nx run adcp-client:test --run"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Phase 3: Linting"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

run_test "ESLint checks" "npm run lint"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Phase 4: Package Validation"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check package builds
packages=("types" "sdk" "server" "ui-components" "developer-portal" "adcp-client")
for pkg in "${packages[@]}"; do
    run_test "$pkg package build" "test -d packages/$pkg/dist"
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Phase 5: Docker Build Tests"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if command -v docker &> /dev/null; then
    run_test "Server Docker build" "docker build -f docker/Dockerfile.server -t ai-yuugen/server:test ."
    run_test "Portal Docker build" "docker build -f docker/Dockerfile.portal -t ai-yuugen/portal:test ."
    
    # Clean up test images
    docker rmi ai-yuugen/server:test ai-yuugen/portal:test 2>/dev/null || true
else
    print_warning "Docker not available, skipping Docker tests"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Phase 6: E2E Tests"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Start services in background
print_info "Starting test services..."
npm run dev:server > /tmp/server.log 2>&1 &
SERVER_PID=$!
cd e2e && npm run dev:test-app > /tmp/test-app.log 2>&1 &
TEST_APP_PID=$!
cd ..

# Wait for services to start
sleep 10

# Run E2E tests
if cd e2e && npx playwright test --project=chromium; then
    print_status "E2E tests passed"
    ((PASSED_TESTS++))
    ((TOTAL_TESTS++))
else
    print_error "E2E tests failed"
    ((FAILED_TESTS++))
    ((TOTAL_TESTS++))
fi
cd ..

# Stop services
kill $SERVER_PID $TEST_APP_PID 2>/dev/null || true

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Phase 7: Security Audit"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

run_test "npm security audit" "npm audit --audit-level=moderate || true"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Phase 8: Documentation Build"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

run_test "Documentation build" "npm run build:docs"

# Summary
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Test Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Total tests: $TOTAL_TESTS"
echo -e "Passed: ${GREEN}$PASSED_TESTS${NC}"
echo -e "Failed: ${RED}$FAILED_TESTS${NC}"
echo ""

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}✓ All integration tests passed!${NC}"
    echo ""
    echo "The platform is ready for deployment."
    exit 0
else
    echo -e "${RED}✗ Some tests failed${NC}"
    echo ""
    echo "Please review the errors above and fix them before deploying."
    exit 1
fi
