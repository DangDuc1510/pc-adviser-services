#!/bin/bash
# Quick script to start Docker services

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}Starting Docker services...${NC}"

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}Creating .env from docker-compose.env.example...${NC}"
    cp docker-compose.env.example .env
    echo -e "${GREEN}✓ .env file created${NC}"
    echo -e "${YELLOW}Please review and update .env file if needed${NC}"
fi

# Start services
docker-compose up -d --build

echo -e "${GREEN}✓ Services started!${NC}"
echo ""
echo "Useful commands:"
echo "  docker-compose ps          - View running services"
echo "  docker-compose logs -f      - View all logs"
echo "  docker-compose down         - Stop all services"
