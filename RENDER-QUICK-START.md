# Render Deployment - Quick Start Guide

## TL;DR - Deploy nhanh trong 5 phút

### 1. Push code lên GitHub
```bash
git add .
git commit -m "Add Render config"
git push
```

### 2. Tạo Blueprint trên Render
1. Vào [render.com](https://render.com)
2. **New +** → **Blueprint**
3. Connect GitHub repo
4. Render sẽ detect `render.yaml` tự động

### 3. Set Environment Variables

Copy và paste các biến này vào mỗi service trong Render Dashboard:

#### Cho TẤT CẢ services:
```bash
JWT_SECRET=ducbd1510
NODE_ENV=production
LOG_LEVEL=info
```

#### MongoDB (mỗi service):
```bash
MONGO_URI=mongodb+srv://ducbd1510:151002@ducbd.a8vx9jc.mongodb.net/
```

#### CORS (mỗi service):
```bash
CORS_ORIGIN=https://your-frontend.com
FRONTEND_URL=https://your-frontend.com
```

#### API Gateway specific:
```bash
API_RATE_LIMIT_WINDOW_MS=60000
API_RATE_LIMIT_MAX_REQUESTS=1000
```

#### Chatbot Service:
```bash
OPENAI_API_KEY=your_key_here
```

#### Order Service:
```bash
VNP_TMN_CODE=FTBW7SJ9
VNP_HASH_SECRET=LSEF047PHY43X3I6B1UVA72MNKVYD00C
VNP_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VNP_API=https://sandbox.vnpayment.vn/merchant_webapi/api/transaction
VNP_RETURN_URL=https://pc-adviser-order-service.onrender.com/payment/vnpay/return
```

#### System Service:
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=duc.bd1510@gmail.com
SMTP_PASS=obqpwazhauxaqvng
EMAIL_FROM=duc.bd1510@gmail.com
```

#### Search Service:
```bash
ELASTICSEARCH_NODE=https://your-elasticsearch-cluster.com
```

### 4. Deploy và chờ

Render sẽ tự động:
- ✅ Build Docker images
- ✅ Deploy tất cả services
- ✅ Set up Redis
- ✅ Configure health checks

### 5. Test

```bash
curl https://pc-adviser-api-gateway.onrender.com/health
```

## Checklist trước khi deploy

- [ ] Code đã push lên GitHub/GitLab
- [ ] MongoDB Atlas IP whitelist đã có Render IPs
- [ ] Tất cả environment variables đã chuẩn bị
- [ ] Elasticsearch cluster đã setup (hoặc dùng Bonsai/Searchly)
- [ ] OpenAI API key đã có (nếu dùng chatbot)
- [ ] VNPay credentials đã có (nếu dùng payment)

## Common Issues

### ❌ Build failed
→ Kiểm tra Dockerfile path và context

### ❌ Service unhealthy
→ Kiểm tra health endpoint và logs

### ❌ MongoDB connection failed
→ Whitelist Render IPs trong MongoDB Atlas

### ❌ Service URLs không hoạt động
→ Đợi vài phút để DNS propagate

## Next Steps

Sau khi deploy thành công:
1. Update frontend với API Gateway URL
2. Test tất cả endpoints
3. Set up monitoring và alerts
4. Configure custom domains (optional)

Xem `RENDER-DEPLOY.md` để biết chi tiết đầy đủ!
