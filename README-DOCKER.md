# Docker Compose Quick Reference

## 🚀 Quick Start

```bash
# 1. Copy environment file
cp docker-compose.env.example .env

# 2. Edit .env file with your values (MongoDB, Redis, etc.)

# 3. Start all services
docker-compose up -d --build

# 4. Check status
docker-compose ps

# 5. View logs
docker-compose logs -f
```

## 📋 Common Commands

### Start/Stop Services

```bash
# Start all services in background
docker-compose up -d

# Start with rebuild (after code changes)
docker-compose up -d --build

# Stop all services
docker-compose down

# Stop and remove volumes
docker-compose down -v

# Restart all services
docker-compose restart

# Restart specific service
docker-compose restart identity-service
```

### View Logs

```bash
# All services (follow)
docker-compose logs -f

# Specific service
docker-compose logs -f api-gateway

# Last 100 lines
docker-compose logs --tail=100 -f identity-service
```

### Check Status

```bash
# List all containers
docker-compose ps

# Health check endpoints
curl http://localhost:3000/health  # API Gateway
curl http://localhost:3001/health  # Identity Service
curl http://localhost:3002/health  # Product Service
curl http://localhost:3003/health  # Order Service
```

### Clean Up

```bash
# Remove stopped containers
docker-compose rm

# Remove everything (containers, volumes, networks)
docker-compose down -v --remove-orphans

# Remove images
docker-compose down --rmi all
```

## 🔌 Service Ports

| Service               | Port | Health Check                           |
| --------------------- | ---- | -------------------------------------- |
| API Gateway           | 3000 | http://localhost:3000/health           |
| Identity Service      | 3001 | http://localhost:3001/health           |
| Product Service       | 3002 | http://localhost:3002/health           |
| Order Service         | 3003 | http://localhost:3003/health           |
| Smart Builder Service | 3004 | http://localhost:3004/health           |
| Search Service        | 3006 | http://localhost:3006/health           |
| System Service        | 3007 | http://localhost:3007/health           |
| Voucher Service       | 3008 | http://localhost:3008/health           |
| Redis                 | 6379 | redis-cli ping                         |
| Elasticsearch         | 9200 | http://localhost:9200/\_cluster/health |

## 🛠️ Troubleshooting

### Service won't start

```bash
# Check logs
docker-compose logs service-name

# Rebuild service
docker-compose up -d --build service-name

# Check if port is already in use
lsof -i :3000
```

### Database connection issues

```bash
# Check MongoDB connection string in .env
# Check Redis connection
docker-compose exec redis redis-cli ping
```

### Reset everything

```bash
# Stop and remove everything
docker-compose down -v --remove-orphans

# Remove images
docker-compose down --rmi all

# Start fresh
docker-compose up -d --build
```
