# Render Environment Variables - Complete List

Sau khi deploy các services lên Render, bạn cần set các environment variables sau. 

**Lưu ý**: Sau khi deploy xong, Render sẽ tự động tạo URLs cho mỗi service. Bạn cần copy các URLs này và update vào các service URLs.

## Bước 1: Deploy và lấy URLs

Sau khi deploy xong, vào mỗi service → **Settings** → copy URL:
- `https://pc-adviser-api-gateway.onrender.com`
- `https://pc-adviser-identity-service.onrender.com`
- `https://pc-adviser-product-service.onrender.com`
- `https://pc-adviser-order-service.onrender.com`
- `https://pc-adviser-smart-builder-service.onrender.com`
- `https://pc-adviser-chatbot-service.onrender.com`
- `https://pc-adviser-search-service.onrender.com`
- `https://pc-adviser-system-service.onrender.com`
- `https://pc-adviser-voucher-service.onrender.com`

## Bước 2: Set Environment Variables

### 🔵 API Gateway (`pc-adviser-api-gateway`)

```bash
PORT=3000
NODE_ENV=production
LOG_LEVEL=info

# Service URLs (update sau khi có URLs thực tế)
IDENTITY_SERVICE_URL=https://pc-adviser-identity-service.onrender.com
PRODUCT_SERVICE_URL=https://pc-adviser-product-service.onrender.com
ORDER_SERVICE_URL=https://pc-adviser-order-service.onrender.com
SMART_BUILDER_SERVICE_URL=https://pc-adviser-smart-builder-service.onrender.com
CHATBOT_SERVICE_URL=https://pc-adviser-chatbot-service.onrender.com
SEARCH_SERVICE_URL=https://pc-adviser-search-service.onrender.com
SYSTEM_SERVICE_URL=https://pc-adviser-system-service.onrender.com
VOUCHER_SERVICE_URL=https://pc-adviser-voucher-service.onrender.com

# JWT & Security
JWT_SECRET=ducbd1510
API_RATE_LIMIT_WINDOW_MS=60000
API_RATE_LIMIT_MAX_REQUESTS=1000

# CORS
CORS_ORIGIN=https://your-frontend-domain.com
```

### 🟢 Identity Service (`pc-adviser-identity-service`)

```bash
PORT=3001
NODE_ENV=production
LOG_LEVEL=info

# MongoDB Atlas
MONGO_URI=mongodb+srv://ducbd1510:151002@ducbd.a8vx9jc.mongodb.net/

# JWT
JWT_SECRET=ducbd1510
JWT_EXPIRES_IN=24h

# Redis (tự động từ Render Redis service)
REDIS_URL=redis://... (Render sẽ tự động set)

# Service URLs
ORDER_SERVICE_URL=https://pc-adviser-order-service.onrender.com
SYSTEM_SERVICE_URL=https://pc-adviser-system-service.onrender.com
VOUCHER_SERVICE_URL=https://pc-adviser-voucher-service.onrender.com

# Frontend
FRONTEND_URL=https://your-frontend-domain.com
CORS_ORIGIN=https://your-frontend-domain.com

# Cloudinary
CLOUDINARY_URL=cloudinary://762612891411269:phYTZX1Ph9Q4syZWoe7VRYDqXf0@dxstpnc1n
```

### 🟡 Product Service (`pc-adviser-product-service`)

```bash
PORT=3002
NODE_ENV=production
LOG_LEVEL=info

# MongoDB Atlas
MONGO_URI=mongodb+srv://ducbd1510:151002@ducbd.a8vx9jc.mongodb.net/

# CORS
CORS_ORIGIN=https://your-frontend-domain.com

# Cloudinary
CLOUDINARY_URL=cloudinary://762612891411269:phYTZX1Ph9Q4syZWoe7VRYDqXf0@dxstpnc1n

# JWT (nếu cần)
JWT_SECRET=ducbd1510
```

### 🟠 Order Service (`pc-adviser-order-service`)

```bash
PORT=3003
NODE_ENV=production
LOG_LEVEL=info

# MongoDB Atlas
MONGO_URI=mongodb+srv://ducbd1510:151002@ducbd.a8vx9jc.mongodb.net/

# JWT
JWT_SECRET=ducbd1510

# Service URLs
PRODUCT_SERVICE_URL=https://pc-adviser-product-service.onrender.com
IDENTITY_SERVICE_URL=https://pc-adviser-identity-service.onrender.com
VOUCHER_SERVICE_URL=https://pc-adviser-voucher-service.onrender.com

# Frontend
FRONTEND_URL=https://your-frontend-domain.com
CORS_ORIGIN=https://your-frontend-domain.com

# VNPay
VNP_TMN_CODE=FTBW7SJ9
VNP_HASH_SECRET=LSEF047PHY43X3I6B1UVA72MNKVYD00C
VNP_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VNP_API=https://sandbox.vnpayment.vn/merchant_webapi/api/transaction
VNP_RETURN_URL=https://pc-adviser-order-service.onrender.com/payment/vnpay/return
```

### 🟣 Smart Builder Service (`pc-adviser-smart-builder-service`)

```bash
PORT=3004
NODE_ENV=production
LOG_LEVEL=info

# MongoDB Atlas
MONGO_URI=mongodb+srv://ducbd1510:151002@ducbd.a8vx9jc.mongodb.net/

# Redis
REDIS_URL=redis://... (Render sẽ tự động set)

# JWT
JWT_SECRET=ducbd1510

# Service URLs
PRODUCT_SERVICE_URL=https://pc-adviser-product-service.onrender.com
IDENTITY_SERVICE_URL=https://pc-adviser-identity-service.onrender.com
ORDER_SERVICE_URL=https://pc-adviser-order-service.onrender.com
VOUCHER_SERVICE_URL=https://pc-adviser-voucher-service.onrender.com

# CORS
CORS_ORIGIN=https://your-frontend-domain.com

# Cache TTL
CACHE_TTL_USER_PREFERENCES=3600
CACHE_TTL_RECOMMENDATIONS=1800
CACHE_TTL_SIMILARITY_MATRIX=86400
```

### 🔴 Chatbot Service (`pc-adviser-chatbot-service`)

```bash
PORT=3005
NODE_ENV=production

# MongoDB Atlas
MONGO_URI=mongodb+srv://ducbd1510:151002@ducbd.a8vx9jc.mongodb.net/chatbot_db

# Redis
REDIS_URL=redis://... (Render sẽ tự động set)

# OpenAI
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4
OPENAI_MAX_TOKENS=1000
OPENAI_TEMPERATURE=0.7

# Service URLs
PRODUCT_SERVICE_URL=https://pc-adviser-product-service.onrender.com
ORDER_SERVICE_URL=https://pc-adviser-order-service.onrender.com
BUILDER_SERVICE_URL=https://pc-adviser-smart-builder-service.onrender.com

# JWT
JWT_SECRET=ducbd1510

# CORS
CORS_ORIGIN=https://your-frontend-domain.com
```

### 🔵 Search Service (`pc-adviser-search-service`)

```bash
PORT=3006
NODE_ENV=production
LOG_LEVEL=info

# Elasticsearch (dùng Bonsai, Searchly, hoặc Elastic Cloud)
ELASTICSEARCH_NODE=https://your-cluster.bonsai.io
ELASTICSEARCH_INDEX=products

# Redis
REDIS_URL=redis://... (Render sẽ tự động set)

# Service URLs
PRODUCT_SERVICE_URL=https://pc-adviser-product-service.onrender.com

# Cache
CACHE_ENABLED=true
CACHE_TTL=900
SEARCH_MAX_RESULTS=100
SEARCH_DEFAULT_SIZE=20
SEARCH_MAX_SIZE=100
```

### 🟢 System Service (`pc-adviser-system-service`)

```bash
PORT=3007
NODE_ENV=production
LOG_LEVEL=info

# MongoDB Atlas
MONGO_URI=mongodb+srv://ducbd1510:151002@ducbd.a8vx9jc.mongodb.net/

# Redis
REDIS_URL=redis://... (Render sẽ tự động set)
REDIS_TTL=900

# CORS
CORS_ORIGIN=https://your-frontend-domain.com

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=duc.bd1510@gmail.com
SMTP_PASS=obqpwazhauxaqvng
EMAIL_FROM=duc.bd1510@gmail.com
EMAIL_FROM_NAME=PC Adviser

# Other
RABBITMQ_URL=amqp://localhost:5672
PROMETHEUS_ENABLED=false
CACHE_ENABLED=true
CACHE_TTL=900
```

### 🟡 Voucher Service (`pc-adviser-voucher-service`)

```bash
PORT=3008
NODE_ENV=production
LOG_LEVEL=info

# MongoDB Atlas
MONGO_URI=mongodb+srv://ducbd1510:151002@ducbd.a8vx9jc.mongodb.net/

# JWT
JWT_SECRET=ducbd1510
JWT_EXPIRES_IN=24h

# Redis
REDIS_URL=redis://... (Render sẽ tự động set)

# Service URLs
ORDER_SERVICE_URL=https://pc-adviser-order-service.onrender.com
IDENTITY_SERVICE_URL=https://pc-adviser-identity-service.onrender.com
PRODUCT_SERVICE_URL=https://pc-adviser-product-service.onrender.com

# CORS
CORS_ORIGIN=https://your-frontend-domain.com

# Cloudinary
CLOUDINARY_URL=cloudinary://762612891411269:phYTZX1Ph9Q4syZWoe7VRYDqXf0@dxstpnc1n

# Rate Limiting
RATE_LIMIT_WINDOW=60000
RATE_LIMIT_MAX=200
```

## Lưu ý quan trọng

1. **Redis URL**: Render sẽ tự động set `REDIS_URL` khi bạn tạo Redis service. Không cần set thủ công.

2. **Service URLs**: Sau khi deploy xong, copy URLs từ mỗi service và update vào các service khác.

3. **MongoDB Atlas**: Đảm bảo whitelist IP của Render:
   - Vào MongoDB Atlas → Network Access
   - Add IP: `0.0.0.0/0` (cho development) hoặc Render IP ranges

4. **Elasticsearch**: Cần setup external service:
   - [Bonsai](https://bonsai.io) - Free tier có sẵn
   - [Searchly](https://searchly.com) - Free tier có sẵn
   - [Elastic Cloud](https://www.elastic.co/cloud) - Free trial

5. **CORS Origin**: Update với domain thực tế của frontend

6. **VNPay Return URL**: Update với URL thực tế của order service trên Render

## Script để copy URLs nhanh

Sau khi deploy, bạn có thể dùng script này để lấy tất cả URLs:

```bash
# Lấy URLs từ Render Dashboard và update vào env vars
# Hoặc dùng Render CLI nếu có
```

Xem `RENDER-DEPLOY.md` để biết chi tiết đầy đủ!
