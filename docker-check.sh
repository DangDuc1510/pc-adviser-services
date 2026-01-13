#!/bin/bash

# Script to check Docker services health and status
# Usage: ./docker-check.sh

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Services to check
SERVICES=(
    "api-gateway:3000"
    "identity-service:3001"
    "product-service:3002"
    "order-service:3003"
    "smart-builder-service:3004"
    "chatbot-service:3005"
    "search-service:3006"
    "system-service:3007"
    "voucher-service:3008"
)

# Dependencies
DEPENDENCIES=(
    "mongodb"
    "redis"
    "elasticsearch"
)

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  PC Adviser Services Health Check${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check Docker daemon
echo -e "${YELLOW}[1/4] Checking Docker daemon...${NC}"
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}✗ Docker daemon is not running!${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Docker daemon is running${NC}"
echo ""

# Check containers status
echo -e "${YELLOW}[2/4] Checking containers status...${NC}"
docker-compose ps
echo ""

# Check dependencies health
echo -e "${YELLOW}[3/4] Checking dependencies health...${NC}"
for dep in "${DEPENDENCIES[@]}"; do
    if docker-compose ps | grep -q "$dep.*Up"; then
        echo -e "${GREEN}✓ $dep is running${NC}"
    else
        echo -e "${RED}✗ $dep is not running${NC}"
    fi
done
echo ""

# Check services health endpoints
echo -e "${YELLOW}[4/4] Checking services health endpoints...${NC}"
echo ""

FAILED_SERVICES=()
SUCCESS_COUNT=0

for service_info in "${SERVICES[@]}"; do
    IFS=':' read -r service_name port <<< "$service_info"
    
    # Check if container is running
    if ! docker-compose ps | grep -q "$service_name.*Up"; then
        echo -e "${RED}✗ $service_name (port $port) - Container not running${NC}"
        FAILED_SERVICES+=("$service_name")
        continue
    fi
    
    # Try to check health endpoint
    if curl -s -f -m 5 "http://localhost:$port/health" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ $service_name (port $port) - Healthy${NC}"
        SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
    else
        echo -e "${YELLOW}⚠ $service_name (port $port) - Container running but health check failed${NC}"
        FAILED_SERVICES+=("$service_name")
    fi
done

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Summary${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "Healthy services: ${GREEN}$SUCCESS_COUNT/${#SERVICES[@]}${NC}"

if [ ${#FAILED_SERVICES[@]} -gt 0 ]; then
    echo -e "Failed services: ${RED}${#FAILED_SERVICES[@]}${NC}"
    echo ""
    echo -e "${YELLOW}Failed services:${NC}"
    for failed in "${FAILED_SERVICES[@]}"; do
        echo -e "  - ${RED}$failed${NC}"
    done
    echo ""
    echo -e "${YELLOW}To view logs of a failed service:${NC}"
    echo -e "  docker-compose logs -f ${FAILED_SERVICES[0]}"
    exit 1
else
    echo -e "${GREEN}All services are healthy! ✓${NC}"
    exit 0
fi
