# Render.yaml Configuration Checklist

## ✅ Đã cấu hình đúng

### Redis Service

- ✅ Redis được định nghĩa và tự động inject connection string vào các services cần thiết
- ✅ Các services sử dụng Redis: Identity, Smart Builder, Chatbot, Search, System, Voucher

### Service URLs tự động

- ✅ Search Service tự động lấy PRODUCT_SERVICE_URL từ Product Service

---

## ⚠️ Các vấn đề cần sửa

### 1. Service URLs - ✅ Đã cập nhật sử dụng `fromService`

**Trạng thái**: ✅ Đã cập nhật render.yaml để sử dụng `fromService` thay vì `sync: false` cho tất cả service URLs.

**Cách hoạt động**:

```yaml
- key: IDENTITY_SERVICE_URL
  fromService:
    type: web
    name: pc-adviser-identity-service
    property: host
```

**Lưu ý quan trọng**:

- `property: host` sẽ trả về hostname (ví dụ: `pc-adviser-identity-service.onrender.com`)
- **Code của bạn cần xử lý**: Nếu hostname không có protocol (`https://`), bạn cần thêm prefix trong code
- **Trên Render**: Các services giao tiếp qua HTTPS, không cần port
- **Giải pháp trong code**: Kiểm tra và thêm `https://` prefix nếu chưa có:

```javascript
const serviceUrl = process.env.IDENTITY_SERVICE_URL;
const fullUrl = serviceUrl.startsWith("http")
  ? serviceUrl
  : `https://${serviceUrl}`;
```

**Lợi ích**:

- ✅ Tự động cập nhật khi service URL thay đổi
- ✅ Giảm lỗi cấu hình thủ công
- ✅ Dễ dàng quản lý dependencies giữa các services

---

### 2. Thiếu biến môi trường

#### Identity Service

- ✅ Đã có đủ các biến cần thiết

#### Product Service

- ✅ Đã có đủ các biến cần thiết

#### Order Service

- ✅ Đã có đủ các biến cần thiết

#### Smart Builder Service

- ✅ Đã có đủ các biến cần thiết
- ✅ Đã thêm các biến cache TTL:
  - ✅ `CACHE_TTL_USER_PREFERENCES` (3600)
  - ✅ `CACHE_TTL_RECOMMENDATIONS` (1800)
  - ✅ `CACHE_TTL_SIMILARITY_MATRIX` (86400)

#### Chatbot Service

- ✅ Đã có đủ các biến cần thiết
- ✅ Đã thêm các biến optional:
  - ✅ `REDIS_SESSION_TTL` (3600)
  - ✅ `RATE_LIMIT_WINDOW_MS` (60000)
  - ✅ `RATE_LIMIT_MAX_REQUESTS` (20)
  - ✅ `MESSAGE_MAX_LENGTH` (1000)
  - ✅ `SESSION_EXPIRE_SECONDS` (3600)

#### Search Service

- ✅ Đã có đủ các biến cần thiết
- ✅ Đã thêm các biến optional:
  - ✅ `SEARCH_MAX_RESULTS` (100)
  - ✅ `SEARCH_DEFAULT_SIZE` (20)
  - ✅ `SEARCH_MAX_SIZE` (100)

#### System Service

- ✅ Đã có đủ các biến cần thiết
- ✅ Đã thêm các biến optional:
  - ✅ `CACHE_ENABLED` (true)
  - ✅ `CACHE_TTL` (900)
  - ✅ `RABBITMQ_URL` (sync: false - optional)
  - ✅ `PROMETHEUS_ENABLED` (false)
  - ℹ️ `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD` không cần vì đã dùng REDIS_URL từ fromService

#### Voucher Service

- ✅ Đã có đủ các biến cần thiết
- ✅ Đã thêm các biến optional:
  - ✅ `JWT_EXPIRES_IN` (24h - đã có từ trước)
  - ✅ `RATE_LIMIT_WINDOW` (60000)
  - ✅ `RATE_LIMIT_MAX` (200)

---

### 3. Service URLs - ✅ Đã tự động hóa bằng `fromService`

**Trạng thái**: ✅ Đã cập nhật render.yaml để tự động inject service URLs.

**Cách hoạt động**:

- Tất cả service URLs đã được cấu hình với `fromService`
- Render tự động inject hostname vào environment variables
- Code cần xử lý để thêm `https://` prefix nếu cần

**Các service URLs đã được tự động hóa**:

- ✅ API Gateway → Tất cả các services khác
- ✅ Order Service → Product, Identity, Voucher
- ✅ Smart Builder → Product, Identity, Order, Voucher
- ✅ Chatbot → Product, Order, Builder
- ✅ Voucher → Order, Identity, Product
- ✅ Identity → Order, System, Voucher
- ✅ Search → Product (đã có từ trước)

**Format URL trên Render**:

- `property: host` trả về: `pc-adviser-identity-service.onrender.com`
- Code cần thêm `https://` prefix: `https://pc-adviser-identity-service.onrender.com`
- Không cần port vì Render tự động route qua HTTPS

---

### 4. CORS_ORIGIN cần được set cho tất cả services

**Vấn đề**: Tất cả services đều có `CORS_ORIGIN` với `sync: false`, nhưng bạn cần set giá trị thực tế.

**Giá trị nên set**:

```
CORS_ORIGIN=https://your-frontend-domain.com,https://your-frontend-domain-2.com
```

---

### 5. Elasticsearch cho Search Service

**Vấn đề**: Search Service cần Elasticsearch nhưng không có trong render.yaml.

**Giải pháp**:

- Option 1: Sử dụng Elasticsearch Cloud (Bonsai, Elastic Cloud, etc.) và set `ELASTICSEARCH_NODE`
- Option 2: Tạo Elasticsearch service trên Render (nếu Render hỗ trợ)
- Option 3: Deploy Elasticsearch trên service riêng

---

## 📋 Checklist các biến cần set trên Render Dashboard

### Bắt buộc phải set (sync: false)

#### API Gateway

- [x] `IDENTITY_SERVICE_URL` - ✅ Tự động từ `fromService`
- [x] `PRODUCT_SERVICE_URL` - ✅ Tự động từ `fromService`
- [x] `ORDER_SERVICE_URL` - ✅ Tự động từ `fromService`
- [x] `SMART_BUILDER_SERVICE_URL` - ✅ Tự động từ `fromService`
- [x] `CHATBOT_SERVICE_URL` - ✅ Tự động từ `fromService`
- [x] `SEARCH_SERVICE_URL` - ✅ Tự động từ `fromService`
- [x] `SYSTEM_SERVICE_URL` - ✅ Tự động từ `fromService`
- [x] `VOUCHER_SERVICE_URL` - ✅ Tự động từ `fromService`
- [ ] `JWT_SECRET` - Your secret key
- [ ] `CORS_ORIGIN` - Your frontend domains

#### Identity Service

- [ ] `MONGO_URI` - MongoDB connection string
- [ ] `JWT_SECRET` - Same as API Gateway
- [ ] `CORS_ORIGIN` - Your frontend domains
- [x] `ORDER_SERVICE_URL` - ✅ Tự động từ `fromService`
- [x] `SYSTEM_SERVICE_URL` - ✅ Tự động từ `fromService`
- [x] `VOUCHER_SERVICE_URL` - ✅ Tự động từ `fromService`
- [ ] `FRONTEND_URL` - Your frontend domain
- [ ] `CLOUDINARY_URL` - Cloudinary connection string

#### Product Service

- [ ] `MONGO_URI` - MongoDB connection string
- [ ] `CORS_ORIGIN` - Your frontend domains
- [ ] `CLOUDINARY_URL` - Cloudinary connection string
- [ ] `JWT_SECRET` - Same as API Gateway

#### Order Service

- [ ] `MONGO_URI` - MongoDB connection string
- [ ] `JWT_SECRET` - Same as API Gateway
- [ ] `CORS_ORIGIN` - Your frontend domains
- [x] `PRODUCT_SERVICE_URL` - ✅ Tự động từ `fromService`
- [x] `IDENTITY_SERVICE_URL` - ✅ Tự động từ `fromService`
- [x] `VOUCHER_SERVICE_URL` - ✅ Tự động từ `fromService`
- [ ] `FRONTEND_URL` - Your frontend domain
- [ ] `VNP_TMN_CODE` - VNPay merchant code
- [ ] `VNP_HASH_SECRET` - VNPay hash secret
- [ ] `VNP_URL` - VNPay payment URL
- [ ] `VNP_API` - VNPay API URL
- [ ] `VNP_RETURN_URL` - Your return URL

#### Smart Builder Service

- [ ] `MONGO_URI` - MongoDB connection string
- [ ] `CORS_ORIGIN` - Your frontend domains
- [ ] `JWT_SECRET` - Same as API Gateway
- [x] `PRODUCT_SERVICE_URL` - ✅ Tự động từ `fromService`
- [x] `IDENTITY_SERVICE_URL` - ✅ Tự động từ `fromService`
- [x] `ORDER_SERVICE_URL` - ✅ Tự động từ `fromService`
- [x] `VOUCHER_SERVICE_URL` - ✅ Tự động từ `fromService`

#### Chatbot Service

- [ ] `MONGO_URI` - MongoDB connection string
- [ ] `OPENAI_API_KEY` - OpenAI API key
- [ ] `CORS_ORIGIN` - Your frontend domains
- [x] `PRODUCT_SERVICE_URL` - ✅ Tự động từ `fromService`
- [x] `ORDER_SERVICE_URL` - ✅ Tự động từ `fromService`
- [x] `BUILDER_SERVICE_URL` - ✅ Tự động từ `fromService`
- [ ] `JWT_SECRET` - Same as API Gateway

#### Search Service

- [ ] `ELASTICSEARCH_NODE` - Elasticsearch connection URL
- [x] `PRODUCT_SERVICE_URL` - ✅ Tự động từ `fromService`

#### System Service

- [ ] `MONGO_URI` - MongoDB connection string
- [ ] `CORS_ORIGIN` - Your frontend domains
- [ ] `SMTP_HOST` - SMTP server
- [ ] `SMTP_USER` - SMTP username
- [ ] `SMTP_PASS` - SMTP password
- [ ] `EMAIL_FROM` - Email sender address

#### Voucher Service

- [ ] `MONGO_URI` - MongoDB connection string
- [ ] `CORS_ORIGIN` - Your frontend domains
- [ ] `JWT_SECRET` - Same as API Gateway
- [x] `ORDER_SERVICE_URL` - ✅ Tự động từ `fromService`
- [x] `IDENTITY_SERVICE_URL` - ✅ Tự động từ `fromService`
- [x] `PRODUCT_SERVICE_URL` - ✅ Tự động từ `fromService`
- [ ] `CLOUDINARY_URL` - Cloudinary connection string

---

## 🚀 Khuyến nghị cải thiện

1. ✅ **Sử dụng `fromService` cho service URLs**: Đã hoàn thành - Giảm lỗi và tự động hóa cấu hình
2. **Thêm các biến optional**: Để có thể tùy chỉnh behavior của services
3. **Tạo Elasticsearch service**: Hoặc hướng dẫn setup Elasticsearch Cloud
4. **Cập nhật code để xử lý hostname**: Đảm bảo code thêm `https://` prefix nếu cần
5. **Documentation**: Tạo script hoặc tool để tự động generate các biến môi trường

---

## 📝 Ghi chú quan trọng

- ✅ **Service URLs**: Đã được tự động hóa bằng `fromService`, không cần set thủ công
- ✅ **Redis connection string**: Được tự động inject, không cần set thủ công
- ⚠️ **Code cần xử lý**: `property: host` trả về hostname không có protocol, code cần thêm `https://` prefix
- **Service URLs trên Render**: Không cần port (Render tự động route qua HTTPS)
- **Các biến có `sync: false`**: Vẫn cần được set thủ công trên Render Dashboard (MONGO_URI, JWT_SECRET, CORS_ORIGIN, etc.)
- **Tất cả services**: Nên dùng HTTPS URLs khi giao tiếp với nhau trên Render
