# Order Service

Service quản lý đơn hàng, giỏ hàng và thanh toán cho hệ thống PC Adviser.

## Tính năng

### Giỏ hàng (Cart)

- ✅ Thêm/sửa/xóa sản phẩm trong giỏ hàng
- ✅ Hỗ trợ cả user đã đăng nhập và guest (session-based)
- ✅ Tự động kiểm tra tồn kho với Product Service
- ✅ Tính toán tổng tiền tự động
- ✅ Hỗ trợ mã giảm giá (coupon)

### Đơn hàng (Orders)

- ✅ Tạo đơn hàng từ giỏ hàng
- ✅ Snapshot thông tin sản phẩm tại thời điểm đặt hàng
- ✅ Quản lý trạng thái đơn hàng với workflow validation
- ✅ Tích hợp với Product Service để reserve/update inventory
- ✅ Hủy đơn hàng và hoàn trả tồn kho
- ✅ Thống kê đơn hàng

### Trạng thái đơn hàng

- `pending_payment` - Chờ thanh toán (VNPay)
- `pending` - Chờ xác nhận (COD)
- `confirmed` - Đã xác nhận
- `processing` - Đang xử lý
- `preparing` - Đang chuẩn bị hàng
- `ready_to_ship` - Sẵn sàng giao hàng
- `shipped` - Đã bàn giao vận chuyển
- `in_transit` - Đang vận chuyển
- `delivered` - Đã giao hàng
- `completed` - Hoàn thành
- `cancelled` - Đã hủy
- `refunded` - Đã hoàn tiền
- `payment_failed` - Thanh toán thất bại

## Cài đặt

```bash
# Install dependencies
npm install

# Copy environment file
cp env.example .env

# Configure environment variables
# Edit .env file with your settings
```

## Biến môi trường

```env
NODE_ENV=development
PORT=3003
MONGO_URI=mongodb://localhost:27017/order_db
JWT_SECRET=your_jwt_secret_here
PRODUCT_SERVICE_URL=http://localhost:3002
IDENTITY_SERVICE_URL=http://localhost:3001
CORS_ORIGIN=http://localhost:4000,http://localhost:3000
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
```

## Chạy service

```bash
# Development mode
npm run dev

# Production mode
npm start
```

## API Endpoints

### Cart

- `GET /cart` - Lấy giỏ hàng
- `GET /cart/summary` - Tóm tắt giỏ hàng
- `POST /cart/items` - Thêm sản phẩm vào giỏ
- `PATCH /cart/items/:productId` - Cập nhật số lượng
- `DELETE /cart/items/:productId` - Xóa sản phẩm
- `DELETE /cart/clear` - Xóa toàn bộ giỏ hàng
- `POST /cart/coupon` - Áp dụng mã giảm giá
- `DELETE /cart/coupon` - Xóa mã giảm giá

### Orders

- `GET /orders` - Danh sách đơn hàng
- `GET /orders/stats` - Thống kê đơn hàng (admin)
- `GET /orders/by-status` - Đơn hàng theo trạng thái (admin)
- `GET /orders/:id` - Chi tiết đơn hàng
- `GET /orders/number/:orderNumber` - Tìm theo mã đơn
- `POST /orders` - Tạo đơn hàng mới
- `PATCH /orders/:id/status` - Cập nhật trạng thái (admin)
- `DELETE /orders/:id` - Hủy đơn hàng

## Tích hợp với Product Service

Order Service tự động tích hợp với Product Service để:

- Kiểm tra tồn kho trước khi thêm vào giỏ
- Reserve stock khi tạo đơn hàng
- Cập nhật stock khi thanh toán thành công
- Release stock khi hủy đơn hàng

Product Service cần có các endpoints:

- `GET /products/:id` - Lấy thông tin sản phẩm
- `PATCH /products/:id/reserve-stock` - Đặt trước hàng
- `PATCH /products/:id/release-stock` - Hoàn trả hàng đặt trước
- `PATCH /products/:id/stock` - Cập nhật tồn kho

## Workflow

```
1. User thêm sản phẩm vào giỏ
   ↓
2. Check stock với Product Service
   ↓
3. User tạo đơn hàng
   ↓
4. Reserve stock, snapshot product data
   ↓
5. Admin cập nhật trạng thái đơn hàng
   ↓
6. Delivered → Completed
```

## Error Handling

Service sử dụng custom error classes:

- `ValidationError` (400)
- `UnauthorizedError` (401)
- `ForbiddenError` (403)
- `NotFoundError` (404)
- `InsufficientStockError` (409)
- `ProductServiceError` (503)

## Tech Stack

- Node.js & Express
- MongoDB & Mongoose
- Axios (HTTP client)
- JWT authentication
- Helmet (security)
- Morgan (logging)
- Express Rate Limit

## Lưu ý

- Service yêu cầu Product Service phải chạy
- JWT token từ Identity Service để authentication
