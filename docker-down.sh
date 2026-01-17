#!/bin/bash
# Quick script to stop Docker services

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}Stopping Docker services...${NC}"

docker-compose down

echo -e "${GREEN}✓ Services stopped!${NC}"
