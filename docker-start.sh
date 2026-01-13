#!/bin/bash

# Script to check Docker and start services
# Usage: ./docker-start.sh

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Checking Docker daemon...${NC}"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}Docker daemon is not running!${NC}"
    echo -e "${YELLOW}Please start Docker Desktop and try again.${NC}"
    echo ""
    echo "On macOS:"
    echo "  1. Open Docker Desktop application"
    echo "  2. Wait for it to start completely"
    echo "  3. Run this script again"
    exit 1
fi

echo -e "${GREEN}✓ Docker daemon is running${NC}"

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}Creating .env file from docker-compose.env.example...${NC}"
    cp docker-compose.env.example .env
    echo -e "${GREEN}✓ .env file created${NC}"
    echo -e "${YELLOW}Please review and update .env file if needed${NC}"
fi

echo ""
echo -e "${YELLOW}Building and starting all services...${NC}"
echo ""

# Build and start services
docker-compose up -d --build

echo ""
echo -e "${GREEN}All services started!${NC}"
echo ""
echo "Useful commands:"
echo "  docker-compose ps          - View running services"
echo "  docker-compose logs -f      - View all logs"
echo "  docker-compose logs -f <service> - View specific service logs"
echo "  docker-compose stop         - Stop all services"
echo "  docker-compose down         - Stop and remove containers"
echo ""
