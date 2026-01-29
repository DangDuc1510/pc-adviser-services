#!/bin/bash
# Quick script to stop Docker services

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}Stopping Docker services...${NC}"

# Check if --volumes flag is passed
if [ "$1" == "--volumes" ] || [ "$1" == "-v" ]; then
    echo -e "${YELLOW}Removing volumes as well...${NC}"
    docker-compose down -v
else
    docker-compose down
fi

echo -e "${GREEN}✓ Services stopped!${NC}"
