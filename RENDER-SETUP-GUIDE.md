# Hướng dẫn Setup Render - Single Container Deployment

## Cách 1: Tạo Service Mới (Khuyến nghị)

### Bước 1: Tạo Web Service mới

1. Vào [Render Dashboard](https://dashboard.render.com)
2. Click **New** → **Web Service**
3. Connect repository:
   - Repository: `https://github.com/DangDuc1510/pc-adviser-services`
   - Branch: `main`
4. Cấu hình cơ bản:
   - **Name**: `pc-adviser-all-services`
   - **Region**: `Oregon` (hoặc region gần bạn nhất)
   - **Plan**: `Free` (hoặc `Starter` nếu cần)

### Bước 2: Cấu hình Docker

Trong phần **Docker Settings**:

- **Dockerfile Path**: `./Dockerfile`
- **Docker Context**: `.` (dấu chấm, nghĩa là root directory)

### Bước 3: Thiết lập Environment Variables

Click vào **Environment** tab và thêm các biến sau:

#### Bắt buộc cho tất cả services:

```env
# API Gateway (Port 3000)
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
JWT_SECRET=your_super_secret_jwt_key_change_this
API_RATE_LIMIT_WINDOW_MS=60000
API_RATE_LIMIT_MAX_REQUESTS=1000
CORS_ORIGIN=https://your-frontend-domain.com,http://localhost:4000
LOG_LEVEL=info

# MongoDB (cho tất cả services cần database)
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/database

# Redis (cho services cần cache)
REDIS_URL=redis://username:password@host:port

# Cloudinary (cho image uploads)
CLOUDINARY_URL=cloudinary://api_key:api_secret@cloud_name

# OpenAI (cho Chatbot Service)
OPENAI_API_KEY=sk-your-openai-api-key
OPENAI_MODEL=gpt-4
OPENAI_MAX_TOKENS=1000
OPENAI_TEMPERATURE=0.7

# VNPay (cho Order Service)
VNP_TMN_CODE=your_vnpay_tmn_code
VNP_HASH_SECRET=your_vnpay_hash_secret
VNP_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VNP_API=https://sandbox.vnpayment.vn/merchant_webapi/api/transaction
VNP_RETURN_URL=https://your-domain.com/payment/vnpay/return

# Email (cho System Service)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
EMAIL_FROM=your_email@gmail.com
EMAIL_FROM_NAME=PC Adviser

# Elasticsearch (cho Search Service)
ELASTICSEARCH_NODE=https://username:password@your-elasticsearch-host:9243
ELASTICSEARCH_INDEX=products

# Frontend URL
FRONTEND_URL=https://your-frontend-domain.com
```

### Bước 4: Health Check

Trong phần **Health Check**:

- **Health Check Path**: `/health`

### Bước 5: Deploy

Click **Create Web Service** và Render sẽ tự động build và deploy.

---

## Cách 2: Cập nhật Service Hiện Tại

Nếu bạn đã có service `pc-adviser-services`:

1. Vào [Render Dashboard](https://dashboard.render.com)
2. Tìm service `pc-adviser-services`
3. Vào **Settings** → **Docker**
4. Cập nhật:
   - **Dockerfile Path**: `./Dockerfile`
   - **Docker Context**: `.`
5. Vào **Environment** và cập nhật các biến môi trường (xem Bước 3 ở trên)
6. Click **Save Changes**
7. Vào **Manual Deploy** → **Deploy latest commit**

---

## Kiểm tra Deployment

Sau khi deploy thành công:

1. **Health Check**:

   ```
   https://your-service-name.onrender.com/health
   ```

   Kết quả mong đợi:

   ```json
   {
     "status": "OK",
     "timestamp": "...",
     "service": "API Gateway"
   }
   ```

2. **Test API Gateway**:

   ```
   https://your-service-name.onrender.com
   ```

3. **Test các endpoints**:
   - `/auth/login` - Identity Service
   - `/products` - Product Service
   - `/orders` - Order Service
   - etc.

---

## Troubleshooting

### Build Failed: "package.json not found"

- ✅ Đảm bảo Dockerfile Path là `./Dockerfile`
- ✅ Đảm bảo Docker Context là `.` (root)
- ✅ Kiểm tra tất cả services có `package.json`

### Services không start

- Kiểm tra logs trên Render Dashboard
- Đảm bảo tất cả environment variables đã được set
- Kiểm tra MongoDB và Redis connection strings

### Services không giao tiếp được

- ✅ Đảm bảo tất cả `*_SERVICE_URL` trỏ đến `http://localhost:PORT`
- ✅ Không dùng `http://service-name:PORT` (chỉ dùng trong Docker Compose)
- ✅ Kiểm tra các services đã start chưa bằng cách xem logs

### Lỗi "Service unavailable" / "Cannot connect to service"

Lỗi này xảy ra khi API Gateway không thể kết nối đến một service cụ thể (ví dụ: Product Service).

**Nguyên nhân thường gặp:**

1. **Service chưa start hoặc đã crash:**

   - Kiểm tra logs trên Render Dashboard
   - Tìm log của service bị lỗi (ví dụ: Product Service)
   - Xem có lỗi MongoDB connection không

2. **MongoDB connection string sai hoặc chưa set:**

   - Kiểm tra `MONGO_URI` trong Environment Variables
   - Đảm bảo MongoDB connection string đúng format
   - Test MongoDB connection từ local machine

3. **Service chưa sẵn sàng khi API Gateway start:**

   - Script start đã được cải thiện để đợi services sẵn sàng
   - Nếu vẫn gặp lỗi, có thể cần tăng timeout trong script

4. **Environment variables thiếu:**
   - Kiểm tra `PRODUCT_SERVICE_URL=http://localhost:3002` đã được set
   - Kiểm tra các biến bắt buộc khác (MONGO_URI, JWT_SECRET, etc.)

**Cách khắc phục:**

1. **Kiểm tra logs trên Render Dashboard:**

   ```
   - Vào service → Logs
   - Tìm log của Product Service
   - Xem có lỗi MongoDB connection không
   ```

2. **Kiểm tra health check của từng service:**

   - Product Service: `http://localhost:3002/health` (trong container)
   - API Gateway: `https://your-service.onrender.com/health`

3. **Kiểm tra Environment Variables:**

   - Đảm bảo `PRODUCT_SERVICE_URL=http://localhost:3002`
   - Đảm bảo `MONGO_URI` đúng và có quyền truy cập

4. **Redeploy service:**
   - Sau khi fix environment variables, redeploy service
   - Đợi vài phút để services start hoàn toàn

### Port conflicts

- ✅ Chỉ port 3000 được expose ra ngoài
- ✅ Các port 3001-3008 chỉ dùng trong container (localhost)

---

## Environment Variables Checklist

Đảm bảo bạn đã set các biến sau:

- [ ] `PORT=3000`
- [ ] `NODE_ENV=production`
- [ ] `MONGO_URI` (MongoDB connection string)
- [ ] `REDIS_URL` (Redis connection string - nếu dùng)
- [ ] `JWT_SECRET` (secret key cho JWT)
- [ ] Tất cả `*_SERVICE_URL` trỏ đến `http://localhost:PORT`
- [ ] `CORS_ORIGIN` (frontend domain)
- [ ] `CLOUDINARY_URL` (nếu cần upload images)
- [ ] `OPENAI_API_KEY` (cho Chatbot Service)
- [ ] `ELASTICSEARCH_NODE` (cho Search Service)
- [ ] Các biến khác theo nhu cầu

---

## Lưu ý quan trọng

1. **Inter-service Communication**:

   - Tất cả services giao tiếp qua `localhost` trong cùng container
   - Không expose port 3001-3008 ra ngoài

2. **Free Tier Limitations**:

   - 750 giờ/tháng
   - Sleep sau ~15 phút không có request
   - Cold start ~30-60 giây

3. **Chi phí**:
   - Free: $0/tháng (750 giờ)
   - Starter: $7/tháng (nếu cần)
   - **Chỉ tính 1 service** thay vì 9!

---

## Next Steps

Sau khi deploy thành công:

1. ✅ Test health check endpoint
2. ✅ Test các API endpoints
3. ✅ Kiểm tra logs để đảm bảo tất cả services đã start
4. ✅ Cấu hình domain (nếu cần)
5. ✅ Setup monitoring và alerts

Chúc bạn deploy thành công! 🚀
