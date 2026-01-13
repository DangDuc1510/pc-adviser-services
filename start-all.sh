#!/bin/bash

# Script to start all microservices
# Usage: ./start-all.sh [dev|start]
# Default: dev mode

MODE=${1:-dev}
SERVICES_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PID_FILE="$SERVICES_DIR/.services.pid"
LOG_DIR="$SERVICES_DIR/logs"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Services to start (in order)
SERVICES=(
    "identity-service"
    "product-service"
    "order-service"
    "voucher-service"
    "chatbot-service"
    "search-service"
    "smart-builder-service"
    "system-service"
    "api-gateway"
)

# Create logs directory
mkdir -p "$LOG_DIR"

# Function to cleanup on exit
cleanup() {
    echo -e "\n${YELLOW}Stopping all services...${NC}"
    if [ -f "$PID_FILE" ]; then
        while read -r pid service; do
            if kill -0 "$pid" 2>/dev/null; then
                echo -e "${YELLOW}Stopping $service (PID: $pid)...${NC}"
                kill "$pid" 2>/dev/null
            fi
        done < "$PID_FILE"
        rm -f "$PID_FILE"
    fi
    echo -e "${GREEN}All services stopped.${NC}"
    exit 0
}

# Trap Ctrl+C and cleanup
trap cleanup SIGINT SIGTERM

# Check if services are already running
if [ -f "$PID_FILE" ]; then
    echo -e "${YELLOW}Found existing PID file. Checking for running services...${NC}"
    while read -r pid service; do
        if kill -0 "$pid" 2>/dev/null; then
            echo -e "${RED}Service $service is already running (PID: $pid)${NC}"
            echo -e "${YELLOW}Please stop existing services first or remove $PID_FILE${NC}"
            exit 1
        fi
    done < "$PID_FILE"
    rm -f "$PID_FILE"
fi

# Validate mode
if [ "$MODE" != "dev" ] && [ "$MODE" != "start" ]; then
    echo -e "${RED}Invalid mode: $MODE${NC}"
    echo "Usage: $0 [dev|start]"
    exit 1
fi

echo -e "${GREEN}Starting all services in $MODE mode...${NC}"
echo ""

# Start each service
for service in "${SERVICES[@]}"; do
    service_dir="$SERVICES_DIR/$service"
    
    if [ ! -d "$service_dir" ]; then
        echo -e "${RED}Service directory not found: $service${NC}"
        continue
    fi
    
    if [ ! -f "$service_dir/package.json" ]; then
        echo -e "${RED}package.json not found in $service${NC}"
        continue
    fi
    
    echo -e "${YELLOW}Starting $service...${NC}"
    
    # Change to service directory and start
    cd "$service_dir" || continue
    
    # Start service in background
    npm run "$MODE" > "$LOG_DIR/$service.log" 2>&1 &
    SERVICE_PID=$!
    
    # Save PID
    echo "$SERVICE_PID $service" >> "$PID_FILE"
    
    echo -e "${GREEN}✓ $service started (PID: $SERVICE_PID)${NC}"
    echo "  Logs: $LOG_DIR/$service.log"
    
    # Small delay between services
    sleep 1
done

echo ""
echo -e "${GREEN}All services started!${NC}"
echo ""
echo "To view logs:"
echo "  tail -f $LOG_DIR/<service-name>.log"
echo ""
echo "To stop all services:"
echo "  ./stop-all.sh"
echo ""
echo "Or press Ctrl+C to stop all services"

# Wait for all background processes
wait

