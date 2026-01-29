#!/bin/bash
# Quick script to view Docker logs

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

SERVICE=${1:-""}

if [ -z "$SERVICE" ]; then
    echo -e "${YELLOW}Viewing logs for all services...${NC}"
    echo -e "${GREEN}Press Ctrl+C to exit${NC}"
    docker-compose logs -f
else
    echo -e "${YELLOW}Viewing logs for $SERVICE...${NC}"
    echo -e "${GREEN}Press Ctrl+C to exit${NC}"
    docker-compose logs -f "$SERVICE"
fi
