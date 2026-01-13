#!/bin/bash

# Script to stop all Docker services
# Usage: ./docker-stop.sh

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Stopping all services...${NC}"

docker-compose down

echo -e "${GREEN}All services stopped!${NC}"
