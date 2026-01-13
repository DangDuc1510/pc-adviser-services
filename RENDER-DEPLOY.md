# Hướng dẫn Deploy PC Adviser Microservices lên Render.com

## Tổng quan

Hướng dẫn này sẽ giúp bạn deploy tất cả 9 microservices của PC Adviser lên Render.com sử dụng Docker và MongoDB Atlas.

## Yêu cầu

- Tài khoản Render.com (free tier có sẵn)
- MongoDB Atlas cluster (đã có)
- GitHub/GitLab repository (để connect với Render)
- Tất cả environment variables cần thiết

## Kiến trúc trên Render

Render.com sẽ deploy:
- **9 Web Services** (mỗi microservice)
- **1 Redis Service** (managed Redis)
- **MongoDB Atlas** (external, đã có)
- **Elasticsearch** (cần dùng external service như Bonsai hoặc Elastic Cloud)

## Bước 1: Chuẩn bị Repository

### 1.1. Đảm bảo các file cần thiết có trong repo

```
services/
├── render.yaml              # ✅ File cấu hình Render (đã tạo)
├── Dockerfile               # ✅ Dockerfile chung (đã có)
├── api-gateway/
├── identity-service/
├── product-service/
├── order-service/
├── smart-builder-service/
├── chatbot-service/
├── search-service/
├── system-service/
└── voucher-service/
```

### 1.2. Commit và push lên GitHub/GitLab

```bash
git add .
git commit -m "Add Render deployment configuration"
git push origin main
```

## Bước 2: Tạo Render Account và Connect Repository

1. Đăng ký/Đăng nhập tại [render.com](https://render.com)
2. Click **"New +"** → **"Blueprint"**
3. Connect với GitHub/GitLab repository của bạn
4. Chọn repository chứa code
5. Render sẽ tự động detect file `render.yaml`

## Bước 3: Cấu hình Environment Variables

Trước khi deploy, bạn cần set các environment variables trong Render Dashboard:

### 3.1. MongoDB Atlas Connection Strings

Vào mỗi service trong Render Dashboard → Environment → Add Environment Variable:

**Identity Service:**
```
MONGO_URI=mongodb+srv://ducbd1510:151002@ducbd.a8vx9jc.mongodb.net/
```

**Product Service:**
```
MONGO_URI=mongodb+srv://ducbd1510:151002@ducbd.a8vx9jc.mongodb.net/
```

**Order Service:**
```
MONGO_URI=mongodb+srv://ducbd1510:151002@ducbd.a8vx9jc.mongodb.net/
```

**Smart Builder Service:**
```
MONGO_URI=mongodb+srv://ducbd1510:151002@ducbd.a8vx9jc.mongodb.net/
```

**Chatbot Service:**
```
MONGO_URI=mongodb+srv://ducbd1510:151002@ducbd.a8vx9jc.mongodb.net/chatbot_db
```

**System Service:**
```
MONGO_URI=mongodb+srv://ducbd1510:151002@ducbd.a8vx9jc.mongodb.net/
```

**Voucher Service:**
```
MONGO_URI=mongodb+srv://ducbd1510:151002@ducbd.a8vx9jc.mongodb.net/
```

### 3.2. JWT Secret (cho tất cả services)

```
JWT_SECRET=ducbd1510
```

### 3.3. CORS Origin

```
CORS_ORIGIN=https://your-frontend-domain.com,https://your-cms-domain.com
```

### 3.4. Frontend URL

```
FRONTEND_URL=https://your-frontend-domain.com
```

### 3.5. Cloudinary (nếu dùng)

```
CLOUDINARY_URL=cloudinary://762612891411269:phYTZX1Ph9Q4syZWoe7VRYDqXf0@dxstpnc1n
```

### 3.6. OpenAI API Key (cho Chatbot Service)

```
OPENAI_API_KEY=your_openai_api_key_here
```

### 3.7. VNPay Configuration (cho Order Service)

```
VNP_TMN_CODE=FTBW7SJ9
VNP_HASH_SECRET=LSEF047PHY43X3I6B1UVA72MNKVYD00C
VNP_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VNP_API=https://sandbox.vnpayment.vn/merchant_webapi/api/transaction
VNP_RETURN_URL=https://your-order-service-url.onrender.com/payment/vnpay/return
```

### 3.8. Email Configuration (cho System Service)

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=duc.bd1510@gmail.com
SMTP_PASS=obqpwazhauxaqvng
EMAIL_FROM=duc.bd1510@gmail.com
```

### 3.9. Elasticsearch (cho Search Service)

**Option 1: Dùng Bonsai (Free tier)**
```
ELASTICSEARCH_NODE=https://your-cluster.bonsai.io
```

**Option 2: Dùng Elastic Cloud (Free trial)**
```
ELASTICSEARCH_NODE=https://your-cluster.es.io:9243
```

**Option 3: Dùng Searchly (Free tier)**
```
ELASTICSEARCH_NODE=https://your-cluster.searchly.com
```

## Bước 4: Deploy Blueprint

1. Sau khi connect repository, Render sẽ hiển thị preview của `render.yaml`
2. Review các services sẽ được tạo
3. Click **"Apply"** để bắt đầu deploy
4. Render sẽ tự động:
   - Tạo Redis service
   - Build và deploy từng service
   - Set up health checks
   - Configure service-to-service communication

## Bước 5: Kiểm tra Deployment

### 5.1. Xem Logs

Vào mỗi service → **Logs** để xem quá trình build và deploy:

```bash
# Logs sẽ hiển thị:
- Building Docker image...
- Installing dependencies...
- Starting service...
- Health check passed ✓
```

### 5.2. Test Health Endpoints

Sau khi deploy xong, test các endpoints:

```bash
# API Gateway
curl https://pc-adviser-api-gateway.onrender.com/health

# Identity Service
curl https://pc-adviser-identity-service.onrender.com/health

# Product Service
curl https://pc-adviser-product-service.onrender.com/health

# ... và các services khác
```

### 5.3. Kiểm tra Service URLs

Render sẽ tự động tạo URLs cho mỗi service:
- `https://pc-adviser-api-gateway.onrender.com`
- `https://pc-adviser-identity-service.onrender.com`
- `https://pc-adviser-product-service.onrender.com`
- ...

## Bước 6: Cấu hình Custom Domains (Optional)

1. Vào service → **Settings** → **Custom Domains**
2. Add domain của bạn
3. Follow instructions để setup DNS records

## Bước 7: Update API Gateway với Production URLs

Sau khi có URLs của các services, update API Gateway environment variables:

```
IDENTITY_SERVICE_URL=https://pc-adviser-identity-service.onrender.com
PRODUCT_SERVICE_URL=https://pc-adviser-product-service.onrender.com
ORDER_SERVICE_URL=https://pc-adviser-order-service.onrender.com
SMART_BUILDER_SERVICE_URL=https://pc-adviser-smart-builder-service.onrender.com
CHATBOT_SERVICE_URL=https://pc-adviser-chatbot-service.onrender.com
SEARCH_SERVICE_URL=https://pc-adviser-search-service.onrender.com
SYSTEM_SERVICE_URL=https://pc-adviser-system-service.onrender.com
VOUCHER_SERVICE_URL=https://pc-adviser-voucher-service.onrender.com
```

## Troubleshooting

### Service không start được

1. **Kiểm tra logs:**
   - Vào service → Logs
   - Tìm lỗi trong quá trình build hoặc start

2. **Kiểm tra environment variables:**
   - Đảm bảo tất cả required variables đã được set
   - Kiểm tra format của connection strings

3. **Kiểm tra MongoDB Atlas:**
   - Đảm bảo IP của Render được whitelist
   - Render IPs: `0.0.0.0/0` (hoặc check Render docs cho IP ranges)

### Service unhealthy

1. **Kiểm tra health endpoint:**
   ```bash
   curl https://your-service.onrender.com/health
   ```

2. **Kiểm tra logs:**
   - Xem có lỗi connection không
   - Kiểm tra database connections

### Redis connection issues

1. **Kiểm tra Redis service:**
   - Vào Redis service → Info
   - Copy connection string
   - Đảm bảo đã set `REDIS_URL` trong các services

### Elasticsearch connection issues

1. **Kiểm tra Elasticsearch URL:**
   - Đảm bảo URL đúng format
   - Kiểm tra credentials nếu có
   - Test connection từ local trước

## Cost Estimation

### Free Tier Limits:
- **Web Services**: 750 hours/month (đủ cho 1 service chạy 24/7)
- **Redis**: 25MB storage
- **Bandwidth**: 100GB/month

### Paid Plans (nếu cần):
- **Starter Plan**: $7/month per service
- **Standard Plan**: $25/month per service
- **Pro Plan**: $85/month per service

**Lưu ý**: Với 9 services, free tier sẽ không đủ. Bạn có thể:
1. Deploy chỉ một số services quan trọng lên Render
2. Dùng free tier cho development/testing
3. Upgrade một số services quan trọng lên paid plan

## Best Practices

### 1. Environment Variables
- ✅ Sử dụng Render's **Environment** tab để manage variables
- ✅ Không commit sensitive data vào git
- ✅ Sử dụng Render's secret management

### 2. Monitoring
- ✅ Enable **Metrics** trong mỗi service
- ✅ Set up **Alerts** cho health checks
- ✅ Monitor **Logs** thường xuyên

### 3. Scaling
- ✅ Start với **Starter Plan**
- ✅ Monitor resource usage
- ✅ Scale up khi cần thiết

### 4. Security
- ✅ Sử dụng HTTPS (Render tự động)
- ✅ Set strong JWT_SECRET
- ✅ Whitelist IPs trong MongoDB Atlas
- ✅ Use environment variables cho sensitive data

## Alternative: Deploy từng Service riêng

Nếu không muốn dùng Blueprint, bạn có thể deploy từng service riêng:

1. **New Web Service** → Connect repo
2. Set **Root Directory** = `services/api-gateway` (hoặc service tương ứng)
3. Set **Dockerfile Path** = `../Dockerfile`
4. Set **Docker Context** = `services/api-gateway`
5. Configure environment variables
6. Deploy

## Kết luận

Sau khi hoàn thành các bước trên, bạn sẽ có:
- ✅ 9 microservices chạy trên Render
- ✅ Redis managed service
- ✅ MongoDB Atlas connection
- ✅ Health checks tự động
- ✅ Auto-deploy từ Git

Xem thêm documentation tại: [Render Docs](https://render.com/docs)
