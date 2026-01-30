# Review: Smart Builder Service sử dụng Search Service

## Tổng quan

Smart Builder Service sử dụng **Search Service** để tối ưu hóa quá trình tính toán recommendations thông qua **Two-Stage Architecture**.

---

## API nào cần Search Service?

### 1. GET /recommendations/compatible ✅

**Flow:**
```
CompatibilityService.getCompatibleRecommendations()
  → RetrievalService.retrieveCandidates() (Stage 1)
    → SearchClient.filterByCompatibility()
      → GET /search/filter (Search Service)
  → CompatibilityService.processProductsBatch() (Stage 2)
    → Score và rank candidates
```

**Endpoint Search Service được gọi:**
- `GET /search/filter` với params:
  - `socket` - CPU socket requirement
  - `ramType` - RAM type requirement
  - `formFactor` - Form factor requirement
  - `minWattage` - Minimum power requirement
  - `minPrice`, `maxPrice` - Price range
  - `brand` - Brand IDs (comma-separated)
  - `category` - Category IDs (comma-separated)
  - `size` - Limit (default: 30)

**Mục đích:**
- Stage 1 (Retrieval): Lọc nhanh từ hàng nghìn products xuống ~30 candidates
- Stage 2 (Ranking): Score và rank 30 candidates này để chọn top 10

---

## Search Service đã đáp ứng được gì?

### ✅ Đã có sẵn

1. **Endpoint `/search/filter`** ✅
   - File: `search-service/src/controllers/search.controller.js`
   - Function: `filterByCompatibility()`
   - Hỗ trợ filter theo:
     - `socket` → `specifications.socket`
     - `ramType` → `specifications.ramTypes`
     - `formFactor` → `specifications.supportedFormFactors`
     - `minWattage` → `specifications.wattage` (range)
     - `minPrice`, `maxPrice` → `price` (range)
     - `brand` → `brandId` (term/terms)
     - `category` → `categoryId` (term/terms)
     - `status` → `status` (term)

2. **Fields được sync vào Elasticsearch** ✅
   - `id`, `_id`
   - `name`, `slug`
   - `price`, `originalPrice`
   - `brand`, `brandId`
   - `category`, `categoryId`
   - `specifications` (object) - **QUAN TRỌNG**
   - `inventory` (object với `inStock`, `available`)
   - `popularity` (number)
   - `status`

3. **Webhook để sync real-time** ✅
   - Endpoint: `POST /search/webhook/product`
   - Actions: `created`, `updated`, `deleted`
   - Tự động index khi Product Service có thay đổi

4. **Script sync products** ✅
   - `npm run sync-products` - Sync và update
   - `npm run sync-products:replace` - Replace toàn bộ

---

## Vấn đề cần kiểm tra

### ⚠️ Fields có thể thiếu

#### 1. **Colors field** ⚠️

**Smart Builder Service cần:**
```javascript
// compatibility.service.js line 86
colors: product.colors || [],
```

**Search Service hiện tại:**
- ❌ **KHÔNG sync `colors` field** vào Elasticsearch
- Transform function (`transformProductToDocument`) không có `colors`
- Index mapping không có `colors` field

**Ảnh hưởng:**
- Không ảnh hưởng đến compatibility filtering (không dùng colors để filter)
- Nhưng có thể ảnh hưởng đến scoring nếu có logic dùng colors

**Giải pháp:**
- Nếu không cần colors cho filtering → OK
- Nếu cần → Thêm `colors` vào transform function và index mapping

#### 2. **Views field** ⚠️

**Smart Builder Service cần:**
```javascript
// compatibility.service.js line 87
views: product.popularity || 0,
```

**Search Service hiện tại:**
- ✅ Có `popularity` field (được map từ `analytics.views` hoặc `popularity`)
- ✅ Được sync vào Elasticsearch
- ✅ Được return trong `/search/filter` response

**Kết luận:** ✅ OK - `popularity` đã đáp ứng được `views`

---

## Fields được return từ `/search/filter`

Từ code `search.controller.js` line 526-540:

```javascript
_source: [
  'id',
  'name',
  'slug',
  'price',
  'originalPrice',
  'brand',
  'brandId',
  'category',
  'categoryId',
  'specifications',  // ✅ QUAN TRỌNG
  'inventory',       // ✅ QUAN TRỌNG
  'popularity',      // ✅ QUAN TRỌNG
  'status',
]
```

**Response format:**
```javascript
{
  id: "...",
  _id: "...",
  name: "...",
  slug: "...",
  price: 5000000,
  originalPrice: 6000000,
  brand: "Intel",
  brandId: "...",
  category: "CPU",
  categoryId: "...",
  specifications: { ... },  // ✅ Object với socket, ramTypes, etc.
  inventory: { inStock: true, available: 10 },
  popularity: 150,
  status: "active",
  _score: 1.5
}
```

---

## Fields Smart Builder Service cần

Từ `retrieval.service.js` line 75-91:

```javascript
{
  _id: product.id || product._id,
  productId: product.id || product._id,
  name: product.name,
  brandId: product.brandId,
  categoryId: product.categoryId,
  pricing: {
    salePrice: product.price,
    originalPrice: product.originalPrice || product.price,
  },
  specifications: product.specifications || {},  // ✅
  colors: product.colors || [],                  // ⚠️
  views: product.popularity || 0,               // ✅ (mapped từ popularity)
  status: product.status,
  isActive: product.status === 'active',
  _score: product._score || 0,
}
```

**So sánh:**

| Field | Search Service có? | Ghi chú |
|-------|-------------------|---------|
| `id`, `_id` | ✅ | Có |
| `name` | ✅ | Có |
| `brandId` | ✅ | Có |
| `categoryId` | ✅ | Có |
| `price` | ✅ | Có (map thành `pricing.salePrice`) |
| `originalPrice` | ✅ | Có (map thành `pricing.originalPrice`) |
| `specifications` | ✅ | Có - **QUAN TRỌNG** |
| `colors` | ❌ | **THIẾU** - Nhưng không ảnh hưởng filtering |
| `popularity` | ✅ | Có (map thành `views`) |
| `status` | ✅ | Có |
| `_score` | ✅ | Có (Elasticsearch score) |

---

## Kết luận

### ✅ Đã đáp ứng được

1. **Endpoint `/search/filter`** - ✅ Hoạt động tốt
2. **Compatibility filtering** - ✅ Đầy đủ:
   - Socket filtering ✅
   - RAM type filtering ✅
   - Form factor filtering ✅
   - Power/wattage filtering ✅
   - Price range filtering ✅
   - Brand/Category filtering ✅
3. **Specifications field** - ✅ Được sync đầy đủ
4. **Inventory field** - ✅ Có `inStock` để filter
5. **Popularity field** - ✅ Có để scoring
6. **Real-time sync** - ✅ Webhook hoạt động

### ⚠️ Cần bổ sung (nếu cần)

1. **Colors field** - ⚠️ Chưa sync
   - **Ảnh hưởng:** Không ảnh hưởng đến filtering
   - **Cần thiết:** Chỉ nếu có logic scoring dùng colors
   - **Khuyến nghị:** Có thể bỏ qua nếu không dùng colors để filter/score

---

## Cần sync lại data không?

### ✅ Không cần sync lại nếu:

1. **Data đã được sync đầy đủ:**
   - Specifications được sync ✅
   - Inventory được sync ✅
   - Popularity được sync ✅
   - Price được sync ✅

2. **Webhook đang hoạt động:**
   - Product Service tự động gọi webhook khi có thay đổi ✅
   - Data được sync real-time ✅

### ⚠️ Cần sync lại nếu:

1. **Lần đầu setup:**
   ```bash
   cd services/search-service
   npm run sync-products
   ```

2. **Sau khi thêm fields mới:**
   - Nếu thêm `colors` field → Cần sync lại
   - Nếu thay đổi mapping → Cần recreate index và sync lại

3. **Data không đồng bộ:**
   - Kiểm tra số lượng products trong Elasticsearch
   - So sánh với Product Service
   - Nếu thiếu → Sync lại

---

## Khuyến nghị

### 1. Kiểm tra data hiện tại

```bash
# Kiểm tra số lượng products trong Elasticsearch
curl http://localhost:9200/products/_count

# So sánh với Product Service
curl http://localhost:3002/products?status=published&limit=1
```

### 2. Nếu cần sync lại

```bash
cd services/search-service

# Sync và update (không xóa data cũ)
npm run sync-products

# Hoặc sync và replace toàn bộ
npm run sync-products:replace
```

### 3. Thêm colors field (nếu cần)

**File cần sửa:**
1. `search-service/src/models/product.index.js` - Thêm mapping
2. `search-service/src/controllers/search.controller.js` - Thêm vào transform function
3. `search-service/scripts/sync-products.js` - Thêm vào transform function

**Sau đó:**
- Recreate index: `npm run setup-index`
- Sync lại: `npm run sync-products:replace`

---

## Tóm tắt

| Tiêu chí | Trạng thái | Ghi chú |
|----------|-----------|---------|
| **Endpoint `/search/filter`** | ✅ | Hoạt động tốt |
| **Compatibility filtering** | ✅ | Đầy đủ các filters |
| **Specifications sync** | ✅ | Đầy đủ |
| **Inventory sync** | ✅ | Có `inStock` |
| **Popularity sync** | ✅ | Có |
| **Colors sync** | ❌ | Thiếu nhưng không ảnh hưởng |
| **Real-time sync** | ✅ | Webhook hoạt động |
| **Cần sync lại data** | ⚠️ | Chỉ nếu lần đầu hoặc thêm fields |

**Kết luận:** Search Service **đã đáp ứng đủ** nhu cầu của Smart Builder Service. Không cần sync lại data trừ khi:
1. Lần đầu setup
2. Thêm fields mới (như colors)
3. Data không đồng bộ
