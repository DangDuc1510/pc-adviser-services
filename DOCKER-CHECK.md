# Docker Services - Hướng dẫn Kiểm tra

## Tổng quan

Hệ thống PC Adviser bao gồm 9 microservices và 3 dependencies (MongoDB, Redis, Elasticsearch).

## Các Scripts Kiểm tra

### 1. Kiểm tra Tổng thể (`docker-check.sh`)

Script này kiểm tra:

- Docker daemon
- Trạng thái containers
- Health của dependencies
- Health endpoints của tất cả services

```bash
./docker-check.sh
```

**Kết quả mong đợi:**

- ✓ Docker daemon is running
- ✓ Tất cả containers đều Up và healthy
- ✓ Tất cả health endpoints trả về 200 OK

### 2. Test API Endpoints (`docker-test-api.sh`)

Script này test:

- Health endpoints của tất cả services
- API Gateway routes
- Database connections (MongoDB, Redis, Elasticsearch)

```bash
./docker-test-api.sh
```

## Kiểm tra Thủ công

### 1. Kiểm tra Trạng thái Containers

```bash
# Xem tất cả containers
docker-compose ps

# Xem containers đang chạy
docker-compose ps | grep Up

# Xem containers có vấn đề
docker-compose ps | grep -E "Exit|Restarting|Unhealthy"
```

### 2. Kiểm tra Logs

```bash
# Xem logs của tất cả services
docker-compose logs -f

# Xem logs của một service cụ thể
docker-compose logs -f api-gateway
docker-compose logs -f identity-service
docker-compose logs -f product-service

# Xem logs 100 dòng cuối
docker-compose logs --tail=100 api-gateway

# Xem logs với timestamp
docker-compose logs -f --timestamps api-gateway
```

### 3. Kiểm tra Health Endpoints

```bash
# API Gateway
curl http://localhost:3000/health

# Identity Service
curl http://localhost:3001/health

# Product Service
curl http://localhost:3002/health

# Order Service
curl http://localhost:3003/health

# Smart Builder Service
curl http://localhost:3004/health

# Chatbot Service
curl http://localhost:3005/health

# Search Service
curl http://localhost:3006/health

# System Service
curl http://localhost:3007/health

# Voucher Service
curl http://localhost:3008/health
```

### 4. Kiểm tra Database Connections

```bash
# MongoDB
docker exec pc-adviser-mongodb mongosh --eval "db.adminCommand('ping')"

# Redis
docker exec pc-adviser-redis redis-cli ping

# Elasticsearch
curl http://localhost:9200/_cluster/health
```

### 5. Kiểm tra Network

```bash
# Xem network
docker network ls | grep pc-adviser

# Inspect network
docker network inspect services_pc-adviser-network

# Test connectivity giữa containers
docker exec pc-adviser-api-gateway ping -c 3 identity-service
docker exec pc-adviser-api-gateway ping -c 3 product-service
```

### 6. Kiểm tra Resource Usage

```bash
# Xem resource usage của containers
docker stats --no-stream

# Xem disk usage
docker system df

# Xem chi tiết một container
docker stats pc-adviser-api-gateway --no-stream
```

## Kiểm tra API Gateway Routes

```bash
# Test các routes qua API Gateway
curl http://localhost:3000/auth/health
curl http://localhost:3000/products/health
curl http://localhost:3000/orders/health
curl http://localhost:3000/search/health
curl http://localhost:3000/chat/health
curl http://localhost:3000/recommendations/health
curl http://localhost:3000/voucher-rules/health
curl http://localhost:3000/statistics/health
```

## Troubleshooting

### Service không start được

1. **Kiểm tra logs:**

```bash
docker-compose logs service-name
```

2. **Kiểm tra environment variables:**

```bash
docker-compose config
```

3. **Restart service:**

```bash
docker-compose restart service-name
```

4. **Rebuild service:**

```bash
docker-compose up -d --build service-name
```

### Service unhealthy

1. **Kiểm tra health check:**

```bash
docker inspect pc-adviser-service-name | grep -A 10 Health
```

2. **Kiểm tra logs:**

```bash
docker-compose logs service-name | tail -50
```

3. **Test health endpoint trực tiếp:**

```bash
curl -v http://localhost:PORT/health
```

### Database connection issues

1. **MongoDB:**

```bash
# Kiểm tra MongoDB đang chạy
docker-compose ps mongodb

# Test connection
docker exec pc-adviser-mongodb mongosh --eval "db.adminCommand('ping')"

# Xem logs
docker-compose logs mongodb
```

2. **Redis:**

```bash
# Kiểm tra Redis đang chạy
docker-compose ps redis

# Test connection
docker exec pc-adviser-redis redis-cli ping

# Xem logs
docker-compose logs redis
```

3. **Elasticsearch:**

```bash
# Kiểm tra Elasticsearch đang chạy
docker-compose ps elasticsearch

# Test connection
curl http://localhost:9200/_cluster/health

# Xem logs
docker-compose logs elasticsearch
```

## Monitoring Commands

### Xem tất cả services cùng lúc

```bash
watch -n 2 'docker-compose ps'
```

### Monitor logs của nhiều services

```bash
docker-compose logs -f api-gateway identity-service product-service
```

### Monitor resource usage

```bash
watch -n 1 'docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}"'
```

## Quick Health Check

Chạy lệnh này để kiểm tra nhanh tất cả services:

```bash
for port in 3000 3001 3002 3003 3004 3005 3006 3007 3008; do
  echo -n "Port $port: "
  curl -s http://localhost:$port/health > /dev/null && echo "✓ OK" || echo "✗ Failed"
done
```

## Kết quả Kiểm tra Hiện tại

✅ **Tất cả 9 services đều healthy:**

- API Gateway (3000)
- Identity Service (3001)
- Product Service (3002)
- Order Service (3003)
- Smart Builder Service (3004)
- Chatbot Service (3005)
- Search Service (3006)
- System Service (3007)
- Voucher Service (3008)

✅ **Tất cả dependencies đều healthy:**

- MongoDB (27017)
- Redis (6379)
- Elasticsearch (9200)

✅ **Tất cả API Gateway routes đều hoạt động**

✅ **Tất cả database connections đều OK**
