# System Service

## Overview

System Service provides system monitoring, statistics aggregation, and health check capabilities for the PC Adviser platform.

## Features

- **Statistics Aggregation**: Dashboard statistics and chart data from multiple services
- **Health Checks**: MongoDB and Redis health monitoring
- **Caching**: Redis integration for performance optimization
- **Email Service**: Send emails using nodemailer with SMTP support

## Installation

```bash
npm install
```

## Configuration

Copy `env.example` to `.env` and configure:

```bash
cp env.example .env
```

### Required Environment Variables

- `MONGO_URI` - MongoDB connection string
- `PORT` - Server port (default: 3007)

### Optional Environment Variables

- `REDIS_HOST`, `REDIS_PORT` - Redis configuration
- `LOG_LEVEL` - Logging level (default: info)
- `CACHE_ENABLED` - Enable/disable Redis cache (default: true)
- `CACHE_TTL` - Cache TTL in seconds (default: 900)
- `SMTP_HOST` - SMTP server host (default: smtp.gmail.com)
- `SMTP_PORT` - SMTP server port (default: 587)
- `SMTP_SECURE` - Use secure connection (default: false)
- `SMTP_USER` - SMTP username/email
- `SMTP_PASS` - SMTP password/app password
- `EMAIL_FROM` - Default sender email address
- `EMAIL_FROM_NAME` - Default sender name (default: PC Adviser)

## Running

### Development

```bash
npm run dev
```

### Production

```bash
npm start
```

## API Endpoints

### Health Checks

- `GET /health` - General health check
- `GET /health/mongodb` - MongoDB health
- `GET /health/redis` - Redis health
- `GET /health/all` - Combined health check

### Statistics

- `GET /statistics/dashboard` - Get dashboard statistics
- `GET /statistics/orders/chart` - Get orders chart data
- `GET /statistics/revenue/chart` - Get revenue chart data
- `GET /statistics/orders/status` - Get orders by status

### Email

- `GET /email/verify` - Verify email service connection
- `POST /email/send` - Send email (supports both text and HTML)
- `POST /email/send/html` - Send HTML email
- `POST /email/send/text` - Send plain text email
- `POST /email/send/bulk` - Send bulk email to multiple recipients

#### Email Request Format

**Send Email:**

```json
{
  "to": "recipient@example.com",
  "subject": "Email Subject",
  "text": "Plain text content",
  "html": "<h1>HTML content</h1>",
  "cc": "cc@example.com",
  "bcc": "bcc@example.com",
  "attachments": []
}
```

**Send Bulk Email:**

```json
{
  "to": ["user1@example.com", "user2@example.com"],
  "subject": "Bulk Email Subject",
  "text": "Plain text content",
  "html": "<h1>HTML content</h1>"
}
```

## Architecture

- **Layered Architecture**: Controllers → Services
- **Caching**: Redis for performance optimization
- **Service Integration**: Communicates with Order, Identity, and Product services

## Dependencies

- Express.js - Web framework
- MongoDB/Mongoose - Database
- Redis (ioredis) - Caching
- Winston - Logging
- Axios - HTTP client for service communication
- Nodemailer - Email sending functionality

## Notes

- Service gracefully degrades if Redis is unavailable
- Statistics endpoints require authentication token
- Health checks are available without authentication
- Email service requires SMTP configuration. If not configured, email endpoints will return errors
- For Gmail, use App Password instead of regular password (enable 2FA and generate app password)
