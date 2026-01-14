#!/bin/sh

# Start all microservices in one container
# API Gateway will be the main entry point on port 3000

# Detect if running in Docker or locally
if [ -d "/app" ]; then
    BASE_DIR="/app"
else
    BASE_DIR="$(cd "$(dirname "$0")" && pwd)"
fi

echo "🚀 Starting all PC Adviser microservices..."
echo "📁 Base directory: $BASE_DIR"

# Function to check if process is running
check_process() {
    local pid=$1
    if ps -p $pid > /dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Function to show service logs on error
show_service_logs() {
    local service_name=$1
    local log_file=$2
    if [ -n "$log_file" ] && [ -f "$log_file" ]; then
        echo "📋 Last 20 lines of $service_name logs:"
        tail -20 "$log_file" 2>/dev/null || echo "  (log file empty or not readable)"
        echo ""
    fi
}

# Function to wait for service to be ready
wait_for_service() {
    local port=$1
    local service_name=$2
    local pid=$3
    local log_file=$4
    local max_attempts=30
    local attempt=0
    
    echo "⏳ Waiting for $service_name to be ready on port $port..."
    
    while [ $attempt -lt $max_attempts ]; do
        # Check if process is still running
        if ! check_process $pid; then
            echo "❌ $service_name process died!"
            show_service_logs "$service_name" "$log_file"
            return 1
        fi
        
        # Check health endpoint
        if curl -f -s http://localhost:$port/health > /dev/null 2>&1; then
            echo "✅ $service_name is ready on port $port"
            return 0
        fi
        
        attempt=$((attempt + 1))
        sleep 1
    done
    
    echo "⚠️  $service_name may not be ready after $max_attempts attempts"
    if check_process $pid; then
        echo "   Process is running but health check failed"
        show_service_logs "$service_name" "$log_file"
    else
        echo "   Process is not running"
        show_service_logs "$service_name" "$log_file"
    fi
    return 1
}

# Function to handle shutdown
cleanup() {
    echo "🛑 Shutting down all services..."
    pkill -P $$ node 2>/dev/null
    exit 0
}

# Trap SIGTERM and SIGINT
trap cleanup SIGTERM SIGINT

# Start Identity Service (port 3001)
echo "📦 Starting Identity Service..."
cd "$BASE_DIR/identity-service" && PORT=3001 NODE_ENV=production node src/app.js 2>&1 | sed 's/^/[Identity] /' &
IDENTITY_PID=$!
echo "   PID: $IDENTITY_PID"
sleep 2
if ! check_process $IDENTITY_PID; then
    echo "❌ Identity Service failed to start! (PID: $IDENTITY_PID)"
    echo "   Checking if process exists..."
    ps aux | grep -E "node.*identity" | grep -v grep || echo "   No identity process found"
fi

# Start Product Service (port 3002)
echo "📦 Starting Product Service..."
cd "$BASE_DIR/product-service" && PORT=3002 NODE_ENV=production node src/app.js 2>&1 | sed 's/^/[Product] /' &
PRODUCT_PID=$!
echo "   PID: $PRODUCT_PID"
sleep 2
if ! check_process $PRODUCT_PID; then
    echo "❌ Product Service failed to start! (PID: $PRODUCT_PID)"
fi

# Start Order Service (port 3003)
echo "📦 Starting Order Service..."
cd "$BASE_DIR/order-service" && PORT=3003 NODE_ENV=production node src/app.js 2>&1 | sed 's/^/[Order] /' &
ORDER_PID=$!
echo "   PID: $ORDER_PID"
sleep 2
if ! check_process $ORDER_PID; then
    echo "❌ Order Service failed to start! (PID: $ORDER_PID)"
fi

# Start Smart Builder Service (port 3004)
echo "📦 Starting Smart Builder Service..."
cd "$BASE_DIR/smart-builder-service" && PORT=3004 NODE_ENV=production node src/app.js 2>&1 | sed 's/^/[SmartBuilder] /' &
SMART_BUILDER_PID=$!
echo "   PID: $SMART_BUILDER_PID"
sleep 2
if ! check_process $SMART_BUILDER_PID; then
    echo "❌ Smart Builder Service failed to start! (PID: $SMART_BUILDER_PID)"
fi

# Start Chatbot Service (port 3005)
echo "📦 Starting Chatbot Service..."
cd "$BASE_DIR/chatbot-service" && PORT=3005 NODE_ENV=production node src/app.js 2>&1 | sed 's/^/[Chatbot] /' &
CHATBOT_PID=$!
echo "   PID: $CHATBOT_PID"
sleep 2
if ! check_process $CHATBOT_PID; then
    echo "❌ Chatbot Service failed to start! (PID: $CHATBOT_PID)"
fi

# Start Search Service (port 3006)
echo "📦 Starting Search Service..."
cd "$BASE_DIR/search-service" && PORT=3006 NODE_ENV=production node src/app.js 2>&1 | sed 's/^/[Search] /' &
SEARCH_PID=$!
echo "   PID: $SEARCH_PID"
sleep 2
if ! check_process $SEARCH_PID; then
    echo "❌ Search Service failed to start! (PID: $SEARCH_PID)"
fi

# Start System Service (port 3007)
echo "📦 Starting System Service..."
cd "$BASE_DIR/system-service" && PORT=3007 NODE_ENV=production node src/app.js 2>&1 | sed 's/^/[System] /' &
SYSTEM_PID=$!
echo "   PID: $SYSTEM_PID"
sleep 2
if ! check_process $SYSTEM_PID; then
    echo "❌ System Service failed to start! (PID: $SYSTEM_PID)"
fi

# Start Voucher Service (port 3008)
echo "📦 Starting Voucher Service..."
cd "$BASE_DIR/voucher-service" && PORT=3008 NODE_ENV=production node src/app.js 2>&1 | sed 's/^/[Voucher] /' &
VOUCHER_PID=$!
echo "   PID: $VOUCHER_PID"
sleep 2
if ! check_process $VOUCHER_PID; then
    echo "❌ Voucher Service failed to start! (PID: $VOUCHER_PID)"
fi

# Wait for critical services to be ready
echo ""
echo "⏳ Waiting for critical services to be ready..."
wait_for_service 3001 "Identity Service" $IDENTITY_PID ""
wait_for_service 3002 "Product Service" $PRODUCT_PID ""
wait_for_service 3003 "Order Service" $ORDER_PID ""

# Wait a bit more for other services (optional but recommended)
echo "⏳ Waiting for remaining services..."
sleep 5

# Start API Gateway (port 3000) - main entry point
echo "🌐 Starting API Gateway..."
cd "$BASE_DIR/api-gateway" && PORT=3000 NODE_ENV=production node src/app.js 2>&1 | sed 's/^/[Gateway] /' &
GATEWAY_PID=$!

# Wait for API Gateway to be ready
wait_for_service 3000 "API Gateway" $GATEWAY_PID ""

echo ""
echo "📊 Service Status Summary:"
echo "=========================="
check_process $IDENTITY_PID && echo "✅ Identity Service (PID: $IDENTITY_PID)" || echo "❌ Identity Service (NOT RUNNING)"
check_process $PRODUCT_PID && echo "✅ Product Service (PID: $PRODUCT_PID)" || echo "❌ Product Service (NOT RUNNING)"
check_process $ORDER_PID && echo "✅ Order Service (PID: $ORDER_PID)" || echo "❌ Order Service (NOT RUNNING)"
check_process $SMART_BUILDER_PID && echo "✅ Smart Builder Service (PID: $SMART_BUILDER_PID)" || echo "❌ Smart Builder Service (NOT RUNNING)"
check_process $CHATBOT_PID && echo "✅ Chatbot Service (PID: $CHATBOT_PID)" || echo "❌ Chatbot Service (NOT RUNNING)"
check_process $SEARCH_PID && echo "✅ Search Service (PID: $SEARCH_PID)" || echo "❌ Search Service (NOT RUNNING)"
check_process $SYSTEM_PID && echo "✅ System Service (PID: $SYSTEM_PID)" || echo "❌ System Service (NOT RUNNING)"
check_process $VOUCHER_PID && echo "✅ Voucher Service (PID: $VOUCHER_PID)" || echo "❌ Voucher Service (NOT RUNNING)"
check_process $GATEWAY_PID && echo "✅ API Gateway (PID: $GATEWAY_PID)" || echo "❌ API Gateway (NOT RUNNING)"
echo "=========================="
echo ""
echo "✅ All services started!"
echo "📡 API Gateway running on port 3000"
echo "💡 Health check: http://localhost:3000/health"
echo ""
echo "📋 Service logs are streamed to stdout/stderr with prefixes:"
echo "   [Identity] [Product] [Order] [SmartBuilder] [Chatbot] [Search] [System] [Voucher] [Gateway]"

# Wait for API Gateway (main process)
wait $GATEWAY_PID
