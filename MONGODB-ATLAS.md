# MongoDB Atlas Configuration

## Tại sao không cần MongoDB Container?

Khi bạn đã sử dụng **MongoDB Atlas** (cloud database), bạn **KHÔNG CẦN** MongoDB container trong Docker nữa vì:

1. ✅ **MongoDB Atlas đã là database server** - không cần chạy MongoDB local
2. ✅ **Tiết kiệm tài nguyên** - không tốn RAM/CPU cho MongoDB container
3. ✅ **Đơn giản hóa** - ít container hơn, dễ quản lý hơn
4. ✅ **Production-ready** - MongoDB Atlas đã có backup, scaling, monitoring

## Cấu hình MongoDB Atlas

### 1. Connection String

Tất cả services đã được cấu hình để kết nối với MongoDB Atlas qua environment variables:

```bash
# Identity Service
IDENTITY_MONGO_URI=mongodb+srv://ducbd1510:151002@ducbd.a8vx9jc.mongodb.net/

# Product Service
PRODUCT_MONGO_URI=mongodb+srv://ducbd1510:151002@ducbd.a8vx9jc.mongodb.net/

# Order Service
ORDER_MONGO_URI=mongodb+srv://ducbd1510:151002@ducbd.a8vx9jc.mongodb.net/

# Smart Builder Service
SMART_BUILDER_MONGO_URI=mongodb+srv://ducbd1510:151002@ducbd.a8vx9jc.mongodb.net/

# System Service
SYSTEM_MONGO_URI=mongodb+srv://ducbd1510:151002@ducbd.a8vx9jc.mongodb.net/

# Voucher Service
VOUCHER_MONGO_URI=mongodb+srv://ducbd1510:151002@ducbd.a8vx9jc.mongodb.net/

# Chatbot Service
CHATBOT_MONGO_URI=mongodb+srv://ducbd1510:151002@ducbd.a8vx9jc.mongodb.net/chatbot_db
```

### 2. Network Access

**QUAN TRỌNG**: Đảm bảo MongoDB Atlas cho phép kết nối từ IP của bạn:

1. Vào MongoDB Atlas Dashboard
2. Network Access → Add IP Address
3. Thêm IP của Docker host hoặc `0.0.0.0/0` (cho development, không khuyến nghị cho production)

### 3. Database Users

Đảm bảo user `ducbd1510` có quyền truy cập các databases cần thiết.

## So sánh: MongoDB Container vs MongoDB Atlas

| Tính năng      | MongoDB Container                 | MongoDB Atlas               |
| -------------- | --------------------------------- | --------------------------- |
| **Setup**      | Cần cài đặt và cấu hình           | Sẵn sàng sử dụng            |
| **Backup**     | Phải tự setup                     | Tự động                     |
| **Scaling**    | Phải tự quản lý                   | Dễ dàng scale               |
| **Monitoring** | Phải tự setup                     | Có sẵn dashboard            |
| **Cost**       | Free (nhưng tốn tài nguyên local) | Free tier có sẵn            |
| **Network**    | Local network                     | Internet (cần whitelist IP) |

## Lợi ích khi dùng MongoDB Atlas

1. ✅ **Không tốn tài nguyên local** - MongoDB container có thể tốn 500MB-2GB RAM
2. ✅ **Backup tự động** - MongoDB Atlas tự động backup
3. ✅ **High Availability** - MongoDB Atlas có replica sets
4. ✅ **Monitoring** - Có sẵn metrics và alerts
5. ✅ **Scaling** - Dễ dàng scale up/down khi cần
6. ✅ **Security** - MongoDB Atlas có security features tốt hơn

## Kiểm tra kết nối MongoDB Atlas

### Từ Docker container:

```bash
# Test connection từ một service
docker exec pc-adviser-identity-service node -e "
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✓ Connected to MongoDB Atlas'))
  .catch(err => console.error('✗ Connection failed:', err.message));
"
```

### Từ local machine:

```bash
# Test connection string
mongosh "mongodb+srv://ducbd1510:151002@ducbd.a8vx9jc.mongodb.net/"
```

## Troubleshooting

### Lỗi: "MongoNetworkError: failed to connect"

**Nguyên nhân**: IP của bạn chưa được whitelist trong MongoDB Atlas

**Giải pháp**:

1. Vào MongoDB Atlas → Network Access
2. Click "Add IP Address"
3. Thêm IP hiện tại hoặc `0.0.0.0/0` (chỉ cho development)

### Lỗi: "Authentication failed"

**Nguyên nhân**: Username/password sai hoặc user không có quyền

**Giải pháp**:

1. Kiểm tra username/password trong connection string
2. Đảm bảo user có quyền truy cập database

### Lỗi: "Connection timeout"

**Nguyên nhân**: Firewall hoặc network issue

**Giải pháp**:

1. Kiểm tra internet connection
2. Kiểm tra firewall settings
3. Thử ping MongoDB Atlas cluster

## Migration từ MongoDB Container sang MongoDB Atlas

Nếu bạn đã có data trong MongoDB container local và muốn migrate:

```bash
# 1. Export data từ local MongoDB
docker exec pc-adviser-mongodb mongodump --out /backup

# 2. Copy backup ra ngoài
docker cp pc-adviser-mongodb:/backup ./mongodb-backup

# 3. Import vào MongoDB Atlas
mongorestore --uri="mongodb+srv://ducbd1510:151002@ducbd.a8vx9jc.mongodb.net/" ./mongodb-backup
```

## Kết luận

✅ **Đã loại bỏ MongoDB container** khỏi docker-compose.yml  
✅ **Tất cả services đã được cấu hình** để dùng MongoDB Atlas  
✅ **Tiết kiệm tài nguyên** và đơn giản hóa hệ thống

Chỉ cần đảm bảo MongoDB Atlas cho phép kết nối từ IP của bạn!
