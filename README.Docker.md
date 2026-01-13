# Docker Deployment Guide

Hướng dẫn deploy toàn bộ các microservices của PC Adviser bằng Docker và Docker Compose.

## Yêu cầu

- Docker Engine 20.10+
- Docker Compose 2.0+
- Tối thiểu 4GB RAM
- Tối thiểu 10GB dung lượng ổ cứng

## Cấu trúc

```
services/
├── Dockerfile              # Dockerfile chung cho tất cả services
├── docker-compose.yml      # File cấu hình Docker Compose
├── .dockerignore           # Files/folders bị loại trừ khi build
├── .env.example            # Template file environment variables
└── README.Docker.md        # File này
```

## Các Services

1. **API Gateway** (Port 3000) - Entry point cho tất cả requests
2. **Identity Service** (Port 3001) - Authentication & User management
3. **Product Service** (Port 3002) - Product & Category management
4. **Order Service** (Port 3003) - Order processing
5. **Smart Builder Service** (Port 3004) - PC configuration recommendations
6. **Chatbot Service** (Port 3005) - AI chatbot
7. **Search Service** (Port 3006) - Product search với Elasticsearch
8. **System Service** (Port 3007) - System utilities & statistics
9. **Voucher Service** (Port 3008) - Voucher & promo code management

## Dependencies

- **MongoDB** (Port 27017) - Database chính
- **Redis** (Port 6379) - Cache & session storage
- **Elasticsearch** (Port 9200) - Search engine

## Cài đặt và Chạy

### 1. Chuẩn bị Environment Variables

```bash
cp .env.example .env
```

Chỉnh sửa file `.env` với các giá trị thực tế của bạn:

```bash
# Bắt buộc phải thay đổi
JWT_SECRET=your_very_secure_secret_key_here
MONGO_ROOT_PASSWORD=your_secure_mongodb_password

# Tùy chọn nhưng khuyến nghị
OPENAI_API_KEY=your_openai_api_key  # Nếu dùng chatbot
CLOUDINARY_URL=your_cloudinary_url   # Nếu upload images
```

### 2. Build và Start Services

```bash
# Build và start tất cả services
docker-compose up -d --build

# Hoặc chỉ build mà không start
docker-compose build

# Start services (không build lại)
docker-compose up -d
```

### 3. Kiểm tra Services

```bash
# Xem trạng thái tất cả containers
docker-compose ps

# Xem logs của tất cả services
docker-compose logs -f

# Xem logs của một service cụ thể
docker-compose logs -f api-gateway
docker-compose logs -f identity-service
```

### 4. Health Checks

Tất cả services đều có health check endpoints:

```bash
# API Gateway
curl http://localhost:3000/health

# Identity Service
curl http://localhost:3001/health

# Product Service
curl http://localhost:3002/health

# ... và các services khác
```

## Quản lý Services

### Stop Services

```bash
# Stop tất cả services
docker-compose stop

# Stop một service cụ thể
docker-compose stop api-gateway
```

### Restart Services

```bash
# Restart tất cả services
docker-compose restart

# Restart một service cụ thể
docker-compose restart identity-service
```

### Remove Services

```bash
# Stop và remove containers (giữ lại volumes)
docker-compose down

# Stop và remove containers + volumes (xóa dữ liệu)
docker-compose down -v
```

### Rebuild một Service

```bash
# Rebuild và restart một service cụ thể
docker-compose up -d --build identity-service
```

## Xem Logs

```bash
# Logs của tất cả services
docker-compose logs -f

# Logs của một service
docker-compose logs -f api-gateway

# Logs với timestamp
docker-compose logs -f --timestamps

# Chỉ xem 100 dòng cuối
docker-compose logs --tail=100 api-gateway
```

## Volumes và Data Persistence

Docker Compose tự động tạo các volumes để lưu trữ dữ liệu:

- `mongodb_data` - MongoDB database files
- `mongodb_config` - MongoDB configuration
- `redis_data` - Redis data
- `elasticsearch_data` - Elasticsearch indices

Để backup dữ liệu:

```bash
# Backup MongoDB
docker exec pc-adviser-mongodb mongodump --out /backup

# Backup Redis
docker exec pc-adviser-redis redis-cli SAVE
```

## Troubleshooting

### Service không start được

1. Kiểm tra logs:

```bash
docker-compose logs service-name
```

2. Kiểm tra health check:

```bash
docker-compose ps
```

3. Kiểm tra port conflicts:

```bash
# Kiểm tra port đã được sử dụng chưa
lsof -i :3000
```

### MongoDB connection issues

1. Đảm bảo MongoDB đã healthy:

```bash
docker-compose ps mongodb
```

2. Kiểm tra MONGO_URI trong .env file

### Redis connection issues

1. Đảm bảo Redis đã healthy:

```bash
docker-compose ps redis
```

2. Test Redis connection:

```bash
docker exec pc-adviser-redis redis-cli ping
```

### Elasticsearch issues

1. Kiểm tra Elasticsearch health:

```bash
curl http://localhost:9200/_cluster/health
```

2. Kiểm tra logs:

```bash
docker-compose logs elasticsearch
```

## Production Deployment

Để deploy lên production:

1. **Security**:

   - Thay đổi tất cả default passwords
   - Sử dụng strong JWT_SECRET
   - Cấu hình firewall rules
   - Sử dụng HTTPS với reverse proxy (nginx/traefik)

2. **Performance**:

   - Tăng resource limits trong docker-compose.yml
   - Sử dụng MongoDB replica set
   - Cấu hình Redis persistence
   - Tối ưu Elasticsearch settings

3. **Monitoring**:

   - Thêm monitoring tools (Prometheus, Grafana)
   - Setup log aggregation (ELK stack)
   - Setup alerting

4. **Backup**:
   - Schedule regular MongoDB backups
   - Backup volumes định kỳ
   - Test restore procedures

## Scaling Services

Để scale một service:

```bash
# Scale identity-service lên 3 instances
docker-compose up -d --scale identity-service=3

# Scale product-service lên 2 instances
docker-compose up -d --scale product-service=2
```

**Lưu ý**: Khi scale, cần đảm bảo load balancer được cấu hình đúng.

## Network

Tất cả services được kết nối qua network `pc-adviser-network`. Services có thể giao tiếp với nhau qua service name:

- `http://identity-service:3001`
- `http://product-service:3002`
- `http://mongodb:27017`
- `http://redis:6379`
- `http://elasticsearch:9200`

## Environment Variables

Xem file `.env.example` để biết tất cả các environment variables có sẵn.

## Support

Nếu gặp vấn đề, vui lòng:

1. Kiểm tra logs: `docker-compose logs`
2. Kiểm tra health checks
3. Xem documentation của từng service
