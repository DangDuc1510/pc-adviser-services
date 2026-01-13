# Voucher Service

Microservice quản lý voucher rules, distributions và triggers cho hệ thống PC Adviser.

## Features

- Voucher Rule Management: Tạo và quản lý các quy tắc phát voucher tự động
- Voucher Distribution: Theo dõi và quản lý việc phân phối voucher
- Voucher Triggers: Xử lý các trigger events từ các service khác
- Scheduled Jobs: Tự động phát voucher theo lịch (birthday, inactivity, segmentation)

## API Endpoints

- `/voucher-rules` - Quản lý voucher rules
- `/voucher-distributions` - Quản lý voucher distributions
- `/voucher-triggers` - Xử lý voucher triggers

## Dependencies

- Identity Service: Lấy thông tin user/customer
- Order Service: Tạo PromoCode khi phân phối voucher

## Environment Variables

See `.env.example` for required environment variables.

## Running

```bash
npm install
npm run dev  # Development mode
npm start    # Production mode
```

