#!/bin/sh

# Start all microservices in one container
# API Gateway will be the main entry point on port 3000

echo "🚀 Starting all PC Adviser microservices..."

# Function to wait for service to be ready
wait_for_service() {
    local port=$1
    local service_name=$2
    local max_attempts=30
    local attempt=0
    
    while [ $attempt -lt $max_attempts ]; do
        if curl -f -s http://localhost:$port/health > /dev/null 2>&1; then
            echo "✅ $service_name is ready on port $port"
            return 0
        fi
        attempt=$((attempt + 1))
        sleep 1
    done
    echo "⚠️  $service_name may not be ready, continuing anyway..."
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

# Start Product Service (port 3002)
echo "📦 Starting Product Service..."
cd /app/product-service && PORT=3002 node src/app.js > /tmp/product.log 2>&1 &
PRODUCT_PID=$!

# Start Order Service (port 3003)
echo "📦 Starting Order Service..."
cd /app/order-service && PORT=3003 node src/app.js > /tmp/order.log 2>&1 &
ORDER_PID=$!

# Start Smart Builder Service (port 3004)
echo "📦 Starting Smart Builder Service..."
cd /app/smart-builder-service && PORT=3004 node src/app.js > /tmp/smart-builder.log 2>&1 &
SMART_BUILDER_PID=$!

# Start Chatbot Service (port 3005)
echo "📦 Starting Chatbot Service..."
cd /app/chatbot-service && PORT=3005 node src/app.js > /tmp/chatbot.log 2>&1 &
CHATBOT_PID=$!

# Start Search Service (port 3006)
echo "📦 Starting Search Service..."
cd /app/search-service && PORT=3006 node src/app.js > /tmp/search.log 2>&1 &
SEARCH_PID=$!

# Start System Service (port 3007)
echo "📦 Starting System Service..."
cd /app/system-service && PORT=3007 node src/app.js > /tmp/system.log 2>&1 &
SYSTEM_PID=$!

# Start Voucher Service (port 3008)
echo "📦 Starting Voucher Service..."
cd /app/voucher-service && PORT=3008 node src/app.js > /tmp/voucher.log 2>&1 &
VOUCHER_PID=$!

# Wait for critical services to be ready
echo "⏳ Waiting for critical services to be ready..."
wait_for_service 3001 "Identity Service"
wait_for_service 3002 "Product Service"
wait_for_service 3003 "Order Service"

# Wait a bit more for other services (optional but recommended)
echo "⏳ Waiting for remaining services..."
sleep 5

# Start API Gateway (port 3000) - main entry point
echo "🌐 Starting API Gateway..."
cd /app/api-gateway && PORT=3000 node src/app.js &
GATEWAY_PID=$!

# Wait for API Gateway to be ready
wait_for_service 3000 "API Gateway"

echo "✅ All services started!"
echo "📡 API Gateway running on port 3000"
echo "💡 Health check: http://localhost:3000/health"

# Wait for API Gateway (main process)
wait $GATEWAY_PID
