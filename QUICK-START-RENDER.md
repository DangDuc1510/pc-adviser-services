# Quick Start: Deploy All Services to Render (Single Container)

## Bước 1: Cập nhật Service trên Render

1. Vào [Render Dashboard](https://dashboard.render.com/web/srv-d5j7i514tr6s73e6hhe0/settings)
2. Trong phần **Docker**, cập nhật:
   - **Dockerfile Path**: `./Dockerfile`
   - **Docker Context**: `.` (root directory)
3. Lưu và deploy lại

## Bước 2: Thiết lập Environment Variables

Thiết lập các biến môi trường cần thiết trên Render Dashboard. Xem chi tiết trong file `RENDER-SINGLE-CONTAINER.md`.

**Quan trọng**: Tất cả các `*_SERVICE_URL` phải trỏ đến `http://localhost:PORT`:
- `IDENTITY_SERVICE_URL=http://localhost:3001`
- `PRODUCT_SERVICE_URL=http://localhost:3002`
- `ORDER_SERVICE_URL=http://localhost:3003`
- etc.

## Bước 3: Deploy

Render sẽ tự động build và deploy khi bạn push code lên GitHub.

## Kiểm tra

Sau khi deploy thành công:
- Health check: `https://your-service.onrender.com/health`
- API Gateway: `https://your-service.onrender.com`

## Lợi ích

✅ **Chỉ tính 1 service** thay vì 9 services riêng biệt
✅ **Tiết kiệm chi phí**: $0-7/tháng thay vì $63-70/tháng
✅ **Đơn giản**: Chỉ cần quản lý 1 container
✅ **Phù hợp**: Cho small/medium applications

## Lưu ý

- Service sẽ sleep sau ~15 phút không có request (free tier)
- Cold start mất ~30-60 giây
- Phù hợp cho backend/internal API
