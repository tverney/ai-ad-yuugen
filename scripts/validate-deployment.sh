#!/bin/bash

# AI Ad Yuugen Deployment Validation Script
# This script validates that the deployment is working correctly

set -e

echo "🔍 Validating AI Ad Yuugen deployment..."

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

# Configuration
SERVER_URL="${SERVER_URL:-http://localhost:3000}"
PORTAL_URL="${PORTAL_URL:-http://localhost:8080}"
TIMEOUT=5

# Function to check HTTP endpoint
check_endpoint() {
    local url=$1
    local expected_status=${2:-200}
    local name=$3
    
    echo -n "Checking $name... "
    
    response=$(curl -s -o /dev/null -w "%{http_code}" --max-time $TIMEOUT "$url" || echo "000")
    
    if [ "$response" == "$expected_status" ]; then
        print_status "$name is responding (HTTP $response)"
        return 0
    else
        print_error "$name failed (HTTP $response, expected $expected_status)"
        return 1
    fi
}

# Function to check JSON endpoint
check_json_endpoint() {
    local url=$1
    local name=$2
    
    echo -n "Checking $name... "
    
    response=$(curl -s --max-time $TIMEOUT "$url" || echo "{}")
    
    if echo "$response" | jq . > /dev/null 2>&1; then
        print_status "$name returned valid JSON"
        return 0
    else
        print_error "$name returned invalid JSON"
        return 1
    fi
}

# Track failures
FAILURES=0

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Server Health Checks"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check server health
check_endpoint "$SERVER_URL/health" 200 "Server health endpoint" || ((FAILURES++))

# Check server metrics
check_endpoint "$SERVER_URL/metrics" 200 "Server metrics endpoint" || ((FAILURES++))

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Portal Health Checks"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check portal health
check_endpoint "$PORTAL_URL/health" 200 "Portal health endpoint" || ((FAILURES++))

# Check portal is serving content
check_endpoint "$PORTAL_URL/" 200 "Portal homepage" || ((FAILURES++))

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "API Functionality Checks"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check ad request endpoint (may require auth, so 401 is acceptable)
response=$(curl -s -o /dev/null -w "%{http_code}" --max-time $TIMEOUT "$SERVER_URL/ads/request" || echo "000")
if [ "$response" == "401" ] || [ "$response" == "200" ]; then
    print_status "Ad request endpoint is accessible (HTTP $response)"
else
    print_error "Ad request endpoint failed (HTTP $response)"
    ((FAILURES++))
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Docker Container Checks"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check if Docker is available
if command -v docker &> /dev/null; then
    # Check if containers are running
    if docker ps --format '{{.Names}}' | grep -q "ai-yuugen"; then
        print_status "Docker containers are running"
        
        # List running containers
        echo ""
        echo "Running containers:"
        docker ps --filter "name=ai-yuugen" --format "  - {{.Names}} ({{.Status}})"
        
        # Check container health
        echo ""
        for container in $(docker ps --filter "name=ai-yuugen" --format "{{.Names}}"); do
            health=$(docker inspect --format='{{.State.Health.Status}}' "$container" 2>/dev/null || echo "no healthcheck")
            if [ "$health" == "healthy" ] || [ "$health" == "no healthcheck" ]; then
                print_status "$container is $health"
            else
                print_error "$container is $health"
                ((FAILURES++))
            fi
        done
    else
        print_warning "No Docker containers found (may not be using Docker)"
    fi
else
    print_warning "Docker not available (may not be using Docker)"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Package Validation"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check if packages are built
packages=("types" "sdk" "server" "ui-components" "developer-portal" "adcp-client")
for pkg in "${packages[@]}"; do
    if [ -d "packages/$pkg/dist" ]; then
        size=$(du -sh "packages/$pkg/dist" | cut -f1)
        print_status "$pkg is built ($size)"
    else
        print_error "$pkg is not built"
        ((FAILURES++))
    fi
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Monitoring Checks"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check Prometheus
PROMETHEUS_URL="${PROMETHEUS_URL:-http://localhost:9090}"
if curl -s --max-time $TIMEOUT "$PROMETHEUS_URL/-/healthy" > /dev/null 2>&1; then
    print_status "Prometheus is healthy"
else
    print_warning "Prometheus is not accessible (may not be deployed)"
fi

# Check Grafana
GRAFANA_URL="${GRAFANA_URL:-http://localhost:3001}"
if curl -s --max-time $TIMEOUT "$GRAFANA_URL/api/health" > /dev/null 2>&1; then
    print_status "Grafana is healthy"
else
    print_warning "Grafana is not accessible (may not be deployed)"
fi

# Check Redis
if command -v redis-cli &> /dev/null; then
    if redis-cli ping > /dev/null 2>&1; then
        print_status "Redis is responding"
    else
        print_warning "Redis is not accessible (may not be deployed)"
    fi
else
    print_warning "Redis CLI not available (may not be deployed)"
fi

# Summary
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ $FAILURES -eq 0 ]; then
    echo -e "${GREEN}✓ All checks passed!${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "Deployment is healthy and ready for use!"
    echo ""
    echo "Access points:"
    echo "  - Server: $SERVER_URL"
    echo "  - Portal: $PORTAL_URL"
    echo "  - Prometheus: $PROMETHEUS_URL"
    echo "  - Grafana: $GRAFANA_URL"
    exit 0
else
    echo -e "${RED}✗ $FAILURES check(s) failed${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "Please review the errors above and fix them."
    echo ""
    echo "Common issues:"
    echo "  - Services not started: docker-compose up -d"
    echo "  - Packages not built: npm run build"
    echo "  - Wrong URLs: Set SERVER_URL and PORTAL_URL environment variables"
    exit 1
fi
