# Giải thích về Docker Healthcheck

## Tại sao các service bị gọi `/health` liên tục?

Đây là **hành vi bình thường và cần thiết** của Docker Healthcheck. Docker tự động gọi endpoint `/health` định kỳ để:

1. ✅ **Theo dõi sức khỏe** của containers
2. ✅ **Phát hiện sớm** khi service bị lỗi
3. ✅ **Tự động restart** containers khi unhealthy
4. ✅ **Hiển thị trạng thái** trong `docker-compose ps`

## Cấu hình Healthcheck

### Trước khi điều chỉnh:

- **Services**: Mỗi 30 giây
- **Dependencies** (MongoDB, Redis): Mỗi 10 giây

### Sau khi điều chỉnh:

- **Tất cả services**: Mỗi **60 giây** (giảm 50% số lần gọi)
- **Dependencies**: Mỗi **30 giây**
- **Start period**: 40-60 giây (cho phép service khởi động trước khi bắt đầu check)

## Các tham số Healthcheck

```yaml
healthcheck:
  test: ["CMD", "node", "-e", "..."] # Lệnh kiểm tra
  interval: 60s # Khoảng thời gian giữa các lần check
  timeout: 10s # Thời gian chờ tối đa cho mỗi check
  retries: 3 # Số lần thử lại trước khi đánh dấu unhealthy
  start_period: 40s # Thời gian chờ sau khi start trước khi bắt đầu check
```

## Tác động của Healthcheck

### Ưu điểm:

- ✅ Phát hiện lỗi sớm
- ✅ Tự động recovery
- ✅ Monitoring tích hợp
- ✅ Phù hợp cho production

### Nhược điểm:

- ⚠️ Tạo thêm traffic (nhưng rất nhỏ)
- ⚠️ Có thể làm logs nhiều hơn

## Tùy chọn điều chỉnh

### 1. Giữ nguyên (Khuyến nghị cho Production)

```yaml
interval: 30s # Check thường xuyên để phát hiện lỗi nhanh
```

### 2. Giảm tần suất (Đã áp dụng)

```yaml
interval: 60s # Check ít hơn, phù hợp cho development
```

### 3. Tăng thêm (Nếu muốn giảm tối đa)

```yaml
interval: 120s # Check mỗi 2 phút
```

### 4. Disable (Không khuyến nghị)

Xóa phần `healthcheck` trong docker-compose.yml (không nên làm trong production)

## Áp dụng thay đổi

Sau khi điều chỉnh healthcheck, bạn cần restart containers:

```bash
# Restart tất cả services để áp dụng healthcheck mới
docker-compose up -d

# Hoặc restart từng service
docker-compose restart api-gateway
```

## Kiểm tra Healthcheck

```bash
# Xem trạng thái healthcheck
docker inspect pc-adviser-api-gateway | grep -A 10 Health

# Xem logs healthcheck (sẽ thấy ít hơn sau khi điều chỉnh)
docker-compose logs api-gateway | grep health
```

## Kết luận

Healthcheck là tính năng quan trọng của Docker. Việc gọi `/health` liên tục là **bình thường và cần thiết**.

Đã điều chỉnh interval từ **30s → 60s** để giảm số lần gọi xuống **50%** mà vẫn đảm bảo monitoring hiệu quả.
