# Search Service

## Mô tả

Search Service cung cấp chức năng tìm kiếm sản phẩm với Elasticsearch. Service này hỗ trợ full-text search, faceted search, autocomplete, và API webhook để nhận thông báo từ Product Service khi có thay đổi sản phẩm.

## Chức năng

- Tìm kiếm toàn văn sản phẩm với advanced ranking
- Gợi ý từ khoá (autocomplete) với fuzzy matching
- Faceted search và filtering
- API webhook để nhận thông báo từ Product Service
- Redis caching cho kết quả tìm kiếm
- Typo tolerance và fuzzy matching

## Cài đặt

### Dependencies

```bash
npm install
```

### Setup Elasticsearch

Chạy Elasticsearch bằng Docker (khuyến nghị):

```bash
docker run -d --name elastic \
  -p 9200:9200 -p 9300:9300 \
  -e "discovery.type=single-node" \
  -e "xpack.security.enabled=false" \
  -e "ES_JAVA_OPTS=-Xms1g -Xmx1g" \
  docker.elastic.co/elasticsearch/elasticsearch:8.12.0
```

**Lưu ý:** Với cấu hình này (`xpack.security.enabled=false`), bạn không cần điền `ELASTICSEARCH_USERNAME` và `ELASTICSEARCH_PASSWORD` trong file `.env`.

Kiểm tra Elasticsearch đã chạy:

```bash
curl http://localhost:9200
```

### Setup Elasticsearch Index

```bash
npm run setup-index
```

### Sync Products từ Product Service

Sau khi setup index, bạn cần sync dữ liệu sản phẩm từ Product Service vào Elasticsearch:

```bash
# Sync và update các sản phẩm (không xóa dữ liệu cũ)
npm run sync-products

# Sync và thay thế toàn bộ (xóa index cũ và tạo lại)
npm run sync-products:replace
```

**Lưu ý:**

- Script sẽ tự động fetch tất cả sản phẩm từ Product Service (chỉ lấy sản phẩm có status = 'published')
- Dữ liệu được index theo batch để tối ưu hiệu suất
- Sau khi sync, các sản phẩm mới/tạo mới sẽ được tự động index qua API webhook từ Product Service

### Chạy service

```bash
# Development
npm run dev

# Production
npm start
```

## Biến môi trường

Xem file `env.example` để biết đầy đủ các biến môi trường cần thiết:

- `PORT` - Port service chạy (default: 8000)
- `NODE_ENV` - Environment (development/staging/production)
- `ELASTICSEARCH_NODE` - Elasticsearch node URL (default: http://localhost:9200)
- `ELASTICSEARCH_INDEX` - Tên index (default: products)
- `ELASTICSEARCH_USERNAME` - ES username (optional, chỉ cần nếu bật security)
- `ELASTICSEARCH_PASSWORD` - ES password (optional, chỉ cần nếu bật security)

**Lưu ý:** Nếu chạy Elasticsearch với `xpack.security.enabled=false` (như Docker command trong README), không cần điền username/password.

- `REDIS_URL` - Redis connection string
- `PRODUCT_SERVICE_URL` - Product Service URL (for initial sync, default: http://localhost:3002)
- `LOG_LEVEL` - Logging level (error/warn/info/debug)
- `CACHE_ENABLED` - Enable/disable cache (default: true)
- `CACHE_TTL` - Cache TTL in seconds (default: 900)

## API Endpoints

### Search

```
GET /search?q=ram&page=1&size=20&category=cpu&brand=intel&minPrice=1000000&maxPrice=5000000
```

**Query Parameters:**

- `q` (optional) - Search query
- `page` (optional) - Page number (default: 1)
- `size` (optional) - Results per page (default: 20, max: 100)
- `category` (optional) - Filter by category
- `brand` (optional) - Filter by brand
- `minPrice` (optional) - Minimum price filter
- `maxPrice` (optional) - Maximum price filter

### Autocomplete

```
GET /search/autocomplete?prefix=gtx
```

**Query Parameters:**

- `prefix` (required) - Search prefix

### Webhook (for Product Service)

```
POST /search/webhook/product
```

**Request Body:**

```json
{
  "action": "created|updated|deleted",
  "product": { ...product data... }
}
```

Product Service sẽ gọi endpoint này khi có thay đổi sản phẩm để tự động index vào Elasticsearch.

### Health Checks

```
GET /health - General health check
GET /health/elasticsearch - Elasticsearch health
GET /health/redis - Redis health
GET /health/all - Combined health check
```

## Công nghệ

- Node.js, Express
- Elasticsearch 8.x
- Redis (ioredis)
- Winston (logging)
- Joi (validation)
- Axios (for HTTP requests)

## Architecture

### API Webhook Indexing

Service nhận thông báo từ Product Service qua API webhook:

- `POST /search/webhook/product` với `action: "created"` - Index sản phẩm mới
- `POST /search/webhook/product` với `action: "updated"` - Update index
- `POST /search/webhook/product` với `action: "deleted"` - Xóa khỏi index

Product Service sẽ tự động gọi webhook này sau khi tạo/cập nhật/xóa sản phẩm.

### Caching Strategy

- Search results được cache trong Redis với TTL 15 phút
- Cache được invalidate khi có product updates
- Cache key format: `search:{query}:{filters}`

### Index Mapping

Index được cấu hình với Vietnamese analyzer để hỗ trợ tìm kiếm tiếng Việt, bao gồm:

- Stop words tiếng Việt
- Vietnamese stemmer
- Completion suggester cho autocomplete

## Development

### Project Structure

```
src/
  config/         # Configuration management
  controllers/    # Request handlers
  elastic/        # Elasticsearch client
  middleware/     # Express middleware
  models/         # Data models/schemas
  routes/         # Route definitions
  services/       # Business logic
  utils/          # Utilities (logger, etc.)
scripts/          # Setup scripts
```

## Notes

- Service tự động kết nối Redis khi khởi động
- Nếu Redis không available, service vẫn chạy nhưng cache sẽ bị disable
- Service hỗ trợ graceful shutdown để đảm bảo cleanup khi restart
- Product Service cần được cấu hình với `SEARCH_SERVICE_URL` để gọi webhook
