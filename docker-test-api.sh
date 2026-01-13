#!/bin/bash

# Script to test API endpoints of all services
# Usage: ./docker-test-api.sh

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  API Endpoints Test${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Test health endpoints
test_health_endpoint() {
    local service_name=$1
    local port=$2
    local endpoint="http://localhost:$port/health"
    
    echo -n "Testing $service_name (port $port)... "
    
    if response=$(curl -s -w "\n%{http_code}" -m 5 "$endpoint" 2>/dev/null); then
        http_code=$(echo "$response" | tail -n1)
        body=$(echo "$response" | sed '$d')
        
        if [ "$http_code" = "200" ]; then
            echo -e "${GREEN}✓ OK${NC}"
            if command -v jq > /dev/null 2>&1; then
                echo "$body" | jq . 2>/dev/null | sed 's/^/  /' || echo "  $body"
            else
                echo "  $body" | sed 's/^/  /'
            fi
            return 0
        else
            echo -e "${RED}✗ Failed (HTTP $http_code)${NC}"
            return 1
        fi
    else
        echo -e "${RED}✗ Connection failed${NC}"
        return 1
    fi
}

# Test API Gateway routes
test_api_gateway_routes() {
    echo ""
    echo -e "${YELLOW}Testing API Gateway routes...${NC}"
    
    routes=(
        "/auth"
        "/products"
        "/orders"
        "/search"
        "/chat"
        "/recommendations"
        "/voucher-rules"
        "/statistics"
    )
    
    for route in "${routes[@]}"; do
        echo -n "  Testing route $route... "
        if curl -s -o /dev/null -w "%{http_code}" -m 5 "http://localhost:3000$route" | grep -q "200\|404\|401\|403"; then
            echo -e "${GREEN}✓ Route exists${NC}"
        else
            echo -e "${YELLOW}⚠ Route may not be available${NC}"
        fi
    done
}

# Test database connections
test_database_connections() {
    echo ""
    echo -e "${YELLOW}Testing database connections...${NC}"
    
    # Test MongoDB
    echo -n "  MongoDB connection... "
    if docker exec pc-adviser-mongodb mongosh --eval "db.adminCommand('ping')" --quiet > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Connected${NC}"
    else
        echo -e "${RED}✗ Failed${NC}"
    fi
    
    # Test Redis
    echo -n "  Redis connection... "
    if docker exec pc-adviser-redis redis-cli ping > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Connected${NC}"
    else
        echo -e "${RED}✗ Failed${NC}"
    fi
    
    # Test Elasticsearch
    echo -n "  Elasticsearch connection... "
    if curl -s http://localhost:9200/_cluster/health > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Connected${NC}"
        cluster_health=$(curl -s http://localhost:9200/_cluster/health | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
        echo "    Cluster status: $cluster_health"
    else
        echo -e "${RED}✗ Failed${NC}"
    fi
}

# Main execution
echo -e "${YELLOW}Testing health endpoints...${NC}"
echo ""

test_health_endpoint "API Gateway" 3000
test_health_endpoint "Identity Service" 3001
test_health_endpoint "Product Service" 3002
test_health_endpoint "Order Service" 3003
test_health_endpoint "Smart Builder Service" 3004
test_health_endpoint "Chatbot Service" 3005
test_health_endpoint "Search Service" 3006
test_health_endpoint "System Service" 3007
test_health_endpoint "Voucher Service" 3008

test_api_gateway_routes
test_database_connections

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}API testing completed!${NC}"
echo -e "${BLUE}========================================${NC}"
