# Deploy All Microservices in One Container on Render

## Tổng quan

Tài liệu này hướng dẫn cách deploy tất cả 9 microservices vào **1 Docker container duy nhất** trên Render để tiết kiệm chi phí (chỉ tính 1 service thay vì 9).

## Kiến trúc

- **1 Container** chứa tất cả 9 services
- **API Gateway** chạy trên port **3000** (exposed ra ngoài)
- Các services khác chạy trên localhost với các port riêng:
  - Identity Service: 3001
  - Product Service: 3002
  - Order Service: 3003
  - Smart Builder Service: 3004
  - Chatbot Service: 3005
  - Search Service: 3006
  - System Service: 3007
  - Voucher Service: 3008

## Cấu hình trên Render

### 1. Tạo Web Service mới

1. Vào [Render Dashboard](https://dashboard.render.com)
2. Click **New** → **Web Service**
3. Connect repository: `https://github.com/DangDuc1510/pc-adviser-services`
4. Cấu hình:
   - **Name**: `pc-adviser-all-services`
   - **Region**: `Oregon` (hoặc region gần bạn nhất)
   - **Branch**: `main`
   - **Runtime**: `Docker`
   - **Dockerfile Path**: `./Dockerfile`
   - **Docker Context**: `.` (root directory)
   - **Plan**: `Free` (hoặc `Starter` nếu cần)

### 2. Environment Variables

Thiết lập các biến môi trường sau trên Render Dashboard:

#### API Gateway (Port 3000 - Main Entry Point)

```env
PORT=3000
NODE_ENV=production
IDENTITY_SERVICE_URL=http://localhost:3001
PRODUCT_SERVICE_URL=http://localhost:3002
ORDER_SERVICE_URL=http://localhost:3003
SMART_BUILDER_SERVICE_URL=http://localhost:3004
CHATBOT_SERVICE_URL=http://localhost:3005
SEARCH_SERVICE_URL=http://localhost:3006
SYSTEM_SERVICE_URL=http://localhost:3007
VOUCHER_SERVICE_URL=http://localhost:3008
JWT_SECRET=your_jwt_secret_here
API_RATE_LIMIT_WINDOW_MS=60000
API_RATE_LIMIT_MAX_REQUESTS=1000
CORS_ORIGIN=https://your-frontend-domain.com
LOG_LEVEL=info
```

#### Identity Service (Port 3001)

```env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=24h
REDIS_URL=your_redis_connection_string
ORDER_SERVICE_URL=http://localhost:3003
SYSTEM_SERVICE_URL=http://localhost:3007
VOUCHER_SERVICE_URL=http://localhost:3008
FRONTEND_URL=https://your-frontend-domain.com
CLOUDINARY_URL=your_cloudinary_url
LOG_LEVEL=info
```

#### Product Service (Port 3002)

```env
MONGO_URI=your_mongodb_connection_string
CORS_ORIGIN=https://your-frontend-domain.com
CLOUDINARY_URL=your_cloudinary_url
JWT_SECRET=your_jwt_secret_here
LOG_LEVEL=info
```

#### Order Service (Port 3003)

```env
MONGO_URI=your_mongodb_connection_string
CORS_ORIGIN=https://your-frontend-domain.com
JWT_SECRET=your_jwt_secret_here
PRODUCT_SERVICE_URL=http://localhost:3002
IDENTITY_SERVICE_URL=http://localhost:3001
VOUCHER_SERVICE_URL=http://localhost:3008
FRONTEND_URL=https://your-frontend-domain.com
VNP_TMN_CODE=your_vnpay_tmn_code
VNP_HASH_SECRET=your_vnpay_hash_secret
VNP_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VNP_API=https://sandbox.vnpayment.vn/merchant_webapi/api/transaction
VNP_RETURN_URL=https://your-domain.com/payment/vnpay/return
LOG_LEVEL=info
```

#### Smart Builder Service (Port 3004)

```env
MONGO_URI=your_mongodb_connection_string
REDIS_URL=your_redis_connection_string
CORS_ORIGIN=https://your-frontend-domain.com
JWT_SECRET=your_jwt_secret_here
PRODUCT_SERVICE_URL=http://localhost:3002
IDENTITY_SERVICE_URL=http://localhost:3001
ORDER_SERVICE_URL=http://localhost:3003
VOUCHER_SERVICE_URL=http://localhost:3008
LOG_LEVEL=info
```

#### Chatbot Service (Port 3005)

```env
MONGO_URI=your_mongodb_connection_string
REDIS_URL=your_redis_connection_string
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-4
OPENAI_MAX_TOKENS=1000
OPENAI_TEMPERATURE=0.7
CORS_ORIGIN=https://your-frontend-domain.com
PRODUCT_SERVICE_URL=http://localhost:3002
ORDER_SERVICE_URL=http://localhost:3003
BUILDER_SERVICE_URL=http://localhost:3004
JWT_SECRET=your_jwt_secret_here
```

#### Search Service (Port 3006)

```env
ELASTICSEARCH_NODE=your_elasticsearch_url
ELASTICSEARCH_INDEX=products
REDIS_URL=your_redis_connection_string
PRODUCT_SERVICE_URL=http://localhost:3002
LOG_LEVEL=info
CACHE_ENABLED=true
CACHE_TTL=900
```

#### System Service (Port 3007)

```env
MONGO_URI=your_mongodb_connection_string
REDIS_URL=your_redis_connection_string
CORS_ORIGIN=https://your-frontend-domain.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
EMAIL_FROM=your_email@gmail.com
EMAIL_FROM_NAME=PC Adviser
LOG_LEVEL=info
```

#### Voucher Service (Port 3008)

```env
MONGO_URI=your_mongodb_connection_string
CORS_ORIGIN=https://your-frontend-domain.com
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=24h
REDIS_URL=your_redis_connection_string
ORDER_SERVICE_URL=http://localhost:3003
IDENTITY_SERVICE_URL=http://localhost:3001
PRODUCT_SERVICE_URL=http://localhost:3002
CLOUDINARY_URL=your_cloudinary_url
LOG_LEVEL=info
```

## Lưu ý quan trọng

### 1. Inter-service Communication

- Tất cả các services giao tiếp với nhau qua **localhost** (trong cùng container)
- Không cần expose các port 3001-3008 ra ngoài
- Chỉ port 3000 (API Gateway) được expose

### 2. External Services

- **MongoDB**: Sử dụng MongoDB Atlas (cloud)
- **Redis**: Sử dụng Render Redis hoặc Redis Cloud
- **Elasticsearch**: Sử dụng Elastic Cloud hoặc Bonsai
- **Cloudinary**: Cho image uploads

### 3. Health Check

- Render sẽ check health tại: `/health` trên port 3000
- API Gateway có endpoint `/health` để kiểm tra

### 4. Free Tier Limitations

- **750 giờ/tháng** cho free tier
- Service sẽ **sleep sau ~15 phút** không có request
- **Cold start** mất ~30-60 giây khi service wake up
- Phù hợp cho backend/internal API

## Kiểm tra Deployment

Sau khi deploy thành công:

1. **Health Check**: `https://your-service.onrender.com/health`
2. **API Gateway**: `https://your-service.onrender.com`
3. **Test các endpoints**:
   - `/auth/login` - Identity Service
   - `/products` - Product Service
   - `/orders` - Order Service
   - etc.

## Troubleshooting

### Service không start

- Kiểm tra logs trên Render Dashboard
- Đảm bảo tất cả environment variables đã được set
- Kiểm tra MongoDB và Redis connection

### Services không giao tiếp được

- Đảm bảo các `*_SERVICE_URL` đều trỏ đến `http://localhost:PORT`
- Kiểm tra các services đã start chưa bằng cách xem logs

### Build failed

- Kiểm tra Dockerfile có đúng không
- Đảm bảo tất cả `package.json` files tồn tại
- Kiểm tra `.dockerignore` không loại trừ files cần thiết

## Chi phí

- **Free Tier**: $0/tháng (750 giờ)
- **Starter Plan**: $7/tháng (nếu cần)
- **Chỉ tính 1 service** thay vì 9 services riêng biệt!

## So sánh với Multi-container

| Aspect         | Single Container  | Multi-container     |
| -------------- | ----------------- | ------------------- |
| Chi phí        | $0-7/tháng        | $63-70/tháng        |
| Cold start     | ~30-60s           | ~30-60s mỗi service |
| Resource usage | Tối ưu            | Cao hơn             |
| Scalability    | Khó scale riêng   | Dễ scale riêng      |
| Phù hợp        | Small/Medium apps | Large apps          |
