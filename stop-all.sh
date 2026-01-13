#!/bin/bash

# Script to stop all running microservices

SERVICES_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PID_FILE="$SERVICES_DIR/.services.pid"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

if [ ! -f "$PID_FILE" ]; then
    echo -e "${YELLOW}No PID file found. No services appear to be running.${NC}"
    exit 0
fi

echo -e "${YELLOW}Stopping all services...${NC}"

STOPPED=0
while read -r pid service; do
    if kill -0 "$pid" 2>/dev/null; then
        echo -e "${YELLOW}Stopping $service (PID: $pid)...${NC}"
        kill "$pid" 2>/dev/null
        sleep 1
        
        # Force kill if still running
        if kill -0 "$pid" 2>/dev/null; then
            echo -e "${RED}Force killing $service (PID: $pid)...${NC}"
            kill -9 "$pid" 2>/dev/null
        fi
        
        echo -e "${GREEN}✓ $service stopped${NC}"
        STOPPED=$((STOPPED + 1))
    else
        echo -e "${YELLOW}$service (PID: $pid) is not running${NC}"
    fi
done < "$PID_FILE"

rm -f "$PID_FILE"

if [ $STOPPED -gt 0 ]; then
    echo -e "\n${GREEN}All services stopped successfully!${NC}"
else
    echo -e "\n${YELLOW}No running services found.${NC}"
fi

