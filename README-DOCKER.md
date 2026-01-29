# Hướng dẫn chạy Docker Services

## Yêu cầu

- Docker và Docker Compose đã được cài đặt
- Đã có quyền truy cập MongoDB Atlas (hoặc MongoDB local)
- Đã có các thông tin cấu hình cần thiết (Cloudinary, VNPay, SMTP, etc.)

## Các bước chạy Docker

### 1. Chuẩn bị môi trường

Di chuyển vào thư mục `services`:
```bash
cd services
```

### 2. Tạo file .env (nếu chưa có)

File `.env` sẽ được tự động tạo từ `docker-compose.env.example` khi chạy script. Hoặc bạn có thể tạo thủ công:

```bash
cp docker-compose.env.example .env
```

Sau đó chỉnh sửa file `.env` với các giá trị thực tế của bạn:
- MongoDB URI
- JWT Secret
- Cloudinary URL
- VNPay credentials
- SMTP settings
- etc.

### 3. Chạy Docker Services

#### Cách 1: Sử dụng script (Khuyến nghị)

```bash
# Cấp quyền thực thi cho script (chỉ cần làm 1 lần)
chmod +x docker-up.sh docker-down.sh docker-logs.sh

# Chạy tất cả services
./docker-up.sh
```

Script sẽ:
- Tự động tạo file `.env` nếu chưa có
- Build và khởi động tất cả services trong background
- Hiển thị các lệnh hữu ích

#### Cách 2: Sử dụng Docker Compose trực tiếp

```bash
# Khởi động tất cả services
docker-compose up -d --build

# Hoặc xem logs khi chạy (không chạy background)
docker-compose up --build
```

### 4. Kiểm tra trạng thái services

```bash
# Xem tất cả services đang chạy
docker-compose ps

# Hoặc xem chi tiết hơn
docker ps
```

### 5. Xem logs

```bash
# Xem logs của tất cả services
./docker-logs.sh

# Hoặc xem logs của một service cụ thể
./docker-logs.sh api-gateway
./docker-logs.sh identity-service
./docker-logs.sh product-service
./docker-logs.sh order-service
./docker-logs.sh smart-builder-service
./docker-logs.sh search-service
./docker-logs.sh system-service
./docker-logs.sh voucher-service

# Hoặc dùng docker-compose trực tiếp
docker-compose logs -f api-gateway
```

### 6. Dừng services

```bash
# Dừng tất cả services (giữ lại volumes và data)
./docker-down.sh

# Dừng và xóa volumes (xóa hết data)
./docker-down.sh --volumes

# Hoặc dùng docker-compose
docker-compose down
docker-compose down -v  # Xóa volumes
```

## Các Services và Ports

| Service | Port | Health Check |
|---------|------|--------------|
| API Gateway | 3000 | http://localhost:3000/health |
| Identity Service | 3001 | http://localhost:3001/health |
| Product Service | 3002 | http://localhost:3002/health |
| Order Service | 3003 | http://localhost:3003/health |
| Smart Builder Service | 3004 | http://localhost:3004/health |
| Search Service | 3006 | http://localhost:3006/health |
| System Service | 3007 | http://localhost:3007/health |
| Voucher Service | 3008 | http://localhost:3008/health |
| Redis | 6379 | - |
| Elasticsearch | 9200 | http://localhost:9200 |

## Các lệnh hữu ích khác

### Restart một service cụ thể
```bash
docker-compose restart api-gateway
```

### Rebuild một service cụ thể
```bash
docker-compose up -d --build api-gateway
```

### Xem logs của một service trong 100 dòng cuối
```bash
docker-compose logs --tail=100 api-gateway
```

### Vào trong container để debug
```bash
docker exec -it pc-adviser-api-gateway sh
```

### Xem resource usage
```bash
docker stats
```

### Xóa tất cả containers, networks, volumes (Cẩn thận!)
```bash
docker-compose down -v --remove-orphans
docker system prune -a --volumes
```

## Troubleshooting

### Services không khởi động được

1. Kiểm tra logs:
```bash
./docker-logs.sh <service-name>
```

2. Kiểm tra file .env có đúng không:
```bash
cat .env
```

3. Kiểm tra ports có bị chiếm không:
```bash
lsof -i :3000  # Kiểm tra port 3000
```

### MongoDB connection error

- Kiểm tra MongoDB URI trong file `.env`
- Đảm bảo MongoDB Atlas IP whitelist đã thêm IP của bạn
- Kiểm tra network connectivity

### Redis connection error

- Đảm bảo Redis container đã khởi động: `docker-compose ps redis`
- Kiểm tra `REDIS_URL` trong `.env`

### Elasticsearch không khởi động

- Elasticsearch cần nhiều memory, đảm bảo Docker có đủ RAM
- Kiểm tra logs: `./docker-logs.sh elasticsearch`

## Lưu ý

- Lần đầu chạy sẽ mất thời gian để build images
- Các services sẽ tự động restart nếu crash (restart: unless-stopped)
- Health checks được cấu hình để đảm bảo services sẵn sàng trước khi các service khác kết nối
- Data được lưu trong Docker volumes, sẽ không mất khi restart containers
