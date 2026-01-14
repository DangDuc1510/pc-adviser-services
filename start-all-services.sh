#!/bin/sh

# Start all microservices in one container
# API Gateway will be the main entry point on port 3000

echo "🚀 Starting all PC Adviser microservices..."

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
    if [ -f "$log_file" ]; then
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
cd /app/identity-service && PORT=3001 node src/app.js > /tmp/identity.log 2>&1 &
IDENTITY_PID=$!
echo "   PID: $IDENTITY_PID | Logs: /tmp/identity.log"
sleep 1
if ! check_process $IDENTITY_PID; then
    echo "❌ Identity Service failed to start!"
    show_service_logs "Identity Service" "/tmp/identity.log"
fi

# Start Product Service (port 3002)
echo "📦 Starting Product Service..."
cd /app/product-service && PORT=3002 node src/app.js > /tmp/product.log 2>&1 &
PRODUCT_PID=$!
echo "   PID: $PRODUCT_PID | Logs: /tmp/product.log"
sleep 1
if ! check_process $PRODUCT_PID; then
    echo "❌ Product Service failed to start!"
    show_service_logs "Product Service" "/tmp/product.log"
fi

# Start Order Service (port 3003)
echo "📦 Starting Order Service..."
cd /app/order-service && PORT=3003 node src/app.js > /tmp/order.log 2>&1 &
ORDER_PID=$!
echo "   PID: $ORDER_PID | Logs: /tmp/order.log"
sleep 1
if ! check_process $ORDER_PID; then
    echo "❌ Order Service failed to start!"
    show_service_logs "Order Service" "/tmp/order.log"
fi

# Start Smart Builder Service (port 3004)
echo "📦 Starting Smart Builder Service..."
cd /app/smart-builder-service && PORT=3004 node src/app.js > /tmp/smart-builder.log 2>&1 &
SMART_BUILDER_PID=$!
echo "   PID: $SMART_BUILDER_PID | Logs: /tmp/smart-builder.log"
sleep 1
if ! check_process $SMART_BUILDER_PID; then
    echo "❌ Smart Builder Service failed to start!"
    show_service_logs "Smart Builder Service" "/tmp/smart-builder.log"
fi

# Start Chatbot Service (port 3005)
echo "📦 Starting Chatbot Service..."
cd /app/chatbot-service && PORT=3005 node src/app.js > /tmp/chatbot.log 2>&1 &
CHATBOT_PID=$!
echo "   PID: $CHATBOT_PID | Logs: /tmp/chatbot.log"
sleep 1
if ! check_process $CHATBOT_PID; then
    echo "❌ Chatbot Service failed to start!"
    show_service_logs "Chatbot Service" "/tmp/chatbot.log"
fi

# Start Search Service (port 3006)
echo "📦 Starting Search Service..."
cd /app/search-service && PORT=3006 node src/app.js > /tmp/search.log 2>&1 &
SEARCH_PID=$!
echo "   PID: $SEARCH_PID | Logs: /tmp/search.log"
sleep 1
if ! check_process $SEARCH_PID; then
    echo "❌ Search Service failed to start!"
    show_service_logs "Search Service" "/tmp/search.log"
fi

# Start System Service (port 3007)
echo "📦 Starting System Service..."
cd /app/system-service && PORT=3007 node src/app.js > /tmp/system.log 2>&1 &
SYSTEM_PID=$!
echo "   PID: $SYSTEM_PID | Logs: /tmp/system.log"
sleep 1
if ! check_process $SYSTEM_PID; then
    echo "❌ System Service failed to start!"
    show_service_logs "System Service" "/tmp/system.log"
fi

# Start Voucher Service (port 3008)
echo "📦 Starting Voucher Service..."
cd /app/voucher-service && PORT=3008 node src/app.js > /tmp/voucher.log 2>&1 &
VOUCHER_PID=$!
echo "   PID: $VOUCHER_PID | Logs: /tmp/voucher.log"
sleep 1
if ! check_process $VOUCHER_PID; then
    echo "❌ Voucher Service failed to start!"
    show_service_logs "Voucher Service" "/tmp/voucher.log"
fi

# Wait for critical services to be ready
echo ""
echo "⏳ Waiting for critical services to be ready..."
wait_for_service 3001 "Identity Service" $IDENTITY_PID "/tmp/identity.log"
wait_for_service 3002 "Product Service" $PRODUCT_PID "/tmp/product.log"
wait_for_service 3003 "Order Service" $ORDER_PID "/tmp/order.log"

# Wait a bit more for other services (optional but recommended)
echo "⏳ Waiting for remaining services..."
sleep 5

# Start API Gateway (port 3000) - main entry point
echo "🌐 Starting API Gateway..."
cd /app/api-gateway && PORT=3000 node src/app.js &
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
echo "📋 To view service logs, check:"
echo "   - Identity: /tmp/identity.log"
echo "   - Product: /tmp/product.log"
echo "   - Order: /tmp/order.log"
echo "   - Smart Builder: /tmp/smart-builder.log"
echo "   - Chatbot: /tmp/chatbot.log"
echo "   - Search: /tmp/search.log"
echo "   - System: /tmp/system.log"
echo "   - Voucher: /tmp/voucher.log"

# Wait for API Gateway (main process)
wait $GATEWAY_PID
