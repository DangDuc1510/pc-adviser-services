# API Review - Cách hoạt động của các API Gợi ý

## Tổng quan

Smart Builder Service cung cấp **5 API endpoints** chính cho recommendation system. Mỗi API sử dụng các thuật toán và chiến lược khác nhau để đưa ra gợi ý phù hợp.

---

## 1. GET /recommendations/compatible - Gợi ý tương thích

### Mục đích
Gợi ý các sản phẩm **tương thích** với các components đã chọn trong PC build.

### Endpoint
```
GET /recommendations/compatible?componentType=motherboard&currentComponents=[...]&limit=10
```

### Flow hoạt động

#### Bước 1: Parse Input
```javascript
// Controller nhận query params
componentType: "motherboard"
currentComponents: JSON.parse(currentComponents) // Array các components đã chọn
limit: 10 (default)
```

#### Bước 2: Extract Requirements
```javascript
// CompatibilityService.extractRequirements()
// Phân tích các components đã chọn để tìm requirements:
- socket: "AM4" (từ CPU)
- ramType: "DDR4" (từ RAM)
- formFactor: "ATX" (từ motherboard)
- powerRequirement: 650W (tổng từ CPU + GPU + ...)
- budgetMin/Max: (nếu có)
```

#### Bước 3: Check Cache
```javascript
// Cache key: compatible:{componentType}:{requirementsHash}
// TTL: 15 phút (900s)
// Nếu cache hit → return ngay (<10ms)
```

#### Bước 4: Two-Stage Architecture (Nếu enabled)

**Stage 1 - Retrieval (Sàng lọc nhanh):**
```javascript
// Gọi search-service API: GET /search/filter
// Filter theo:
- socket: "AM4"
- ramType: "DDR4"  
- formFactor: "ATX"
- minWattage: 650
- minPrice/maxPrice: (nếu có)
// Kết quả: ~30 candidates trong <50ms
```

**Stage 2 - Ranking (Xếp hạng chính xác):**
```javascript
// Score từng candidate với:
1. Compatibility Score (50%): 
   - Socket match? → +100
   - RAM type match? → +100
   - Form factor match? → +100
   - Power sufficient? → +100

2. Price Score (20%):
   - Trong budget range? → +100
   - Gần middle của range? → Score cao hơn

3. Brand Score (20%):
   - Match user preferences? → +100

4. Popularity Score (10%):
   - views / 1000 → normalized

// Final Score = weighted sum
// Sort descending → Top 10
```

#### Bước 5: Return Results
```javascript
{
  componentType: "motherboard",
  recommendations: [
    {
      productId: "...",
      product: {...},
      score: 85,
      compatibility: { socket: "match", ramType: "match" },
      reasons: ["Socket AM4 tương thích", "Hỗ trợ DDR4"],
      scores: { compatibility: 100, price: 80, brand: 70, popularity: 50 }
    },
    ...
  ],
  filters: { socket: "AM4", ramType: "DDR4" },
  fromCache: false,
  duration: "150ms"
}
```

### Điểm đặc biệt
- ✅ **Two-stage architecture**: Retrieval nhanh → Ranking chính xác
- ✅ **Compatibility checking**: Đảm bảo tương thích về socket, RAM, form factor, power
- ✅ **Caching**: Cache cả retrieval results và final recommendations
- ✅ **Early exit**: Dừng sớm nếu đã có đủ recommendations tốt

---

## 2. GET /recommendations/favorites - Sản phẩm yêu thích

### Mục đích
Gợi ý các sản phẩm user **đã tương tác nhiều** trong khoảng thời gian gần đây.

### Endpoint
```
GET /recommendations/favorites?userId=123&timeWindow=30&limit=20&category=cpu
```

### Flow hoạt động

#### Bước 1: Fetch Behavior Data
```javascript
// Gọi Identity Service: GET /behavior/user/{userId}
// Lấy tối đa 1000 events gần đây
// Events bao gồm: view, click, add_to_cart, remove_from_cart, purchase
```

#### Bước 2: Filter by Time Window
```javascript
// Chỉ tính events trong 30 ngày gần nhất (default)
cutoffDate = new Date() - 30 days
recentEvents = events.filter(event => event.timestamp >= cutoffDate)
```

#### Bước 3: Group by Product & Calculate Scores
```javascript
// Với mỗi product, tính:
interactions = {
  views: 5,
  clicks: 3,
  add_to_cart: 2,
  purchase: 1,
  remove_from_cart: 0
}

// Base Score từ interactions:
baseScore = views*1 + clicks*2 + add_to_cart*3 + purchase*5 - remove_from_cart*2

// Recency Multiplier:
daysAgo = (now - lastInteraction) / days
recencyMultiplier = 1 + (1 - daysAgo/30) * 0.5
// → Events càng gần đây → Score càng cao

// Final Score:
score = baseScore * recencyMultiplier

// Penalty cho remove_from_cart:
if (removeCount > 0) {
  penalty = min(removeCount * 0.2, 0.6) // Max 60% reduction
  score = score * (1 - penalty)
}
```

#### Bước 4: Filter & Validate Products
```javascript
// Loại bỏ:
- Products removed >= 3 lần
- Products removed > added to cart
- Products không active/published
- Products không match category (nếu có)

// Fetch product details từ Product Service
// Chỉ giữ products có score > 0
```

#### Bước 5: Sort & Return
```javascript
// Sort by score descending
// Limit theo limit parameter
// Cache với key: rec:{userId}:favorites:{category}
// TTL: 30 phút
```

### Điểm đặc biệt
- ✅ **Recency weighting**: Events gần đây có trọng số cao hơn
- ✅ **Interaction weights**: Purchase (5) > add_to_cart (3) > click (2) > view (1)
- ✅ **Remove penalty**: Giảm score nếu user remove khỏi cart
- ✅ **Time window filtering**: Chỉ tính events trong khoảng thời gian nhất định

---

## 3. GET /recommendations/similar - Sản phẩm tương tự

### Mục đích
Tìm các sản phẩm **tương tự** với một sản phẩm cụ thể dựa trên features (brand, price, specifications).

### Endpoint
```
GET /recommendations/similar?productId=abc123&limit=10&category=cpu
```

### Flow hoạt động

#### Bước 1: Get Reference Product
```javascript
// Fetch product từ Product Service
referenceProduct = await productClient.getProduct(productId)
// Extract features:
features = {
  brand: "Intel",
  price: 5000000,
  specifications: {
    socket: "LGA1700",
    cores: 8,
    threads: 16
  },
  colors: ["black"],
  useCases: ["gaming", "workstation"]
}
```

#### Bước 2: Fetch Candidates
```javascript
// Fetch products từ cùng category (hoặc component type)
// Limit: 30 products (sau khi giảm)
filters = {
  categoryId: referenceProduct.categoryId,
  status: "published",
  isActive: true,
  limit: 30
}
products = await productClient.getProducts(filters)
```

#### Bước 3: Calculate Similarity
```javascript
// Với mỗi product:
similarityScore = calculateProductSimilarity(referenceFeatures, productFeatures)

// Tính toán:
1. Brand match: Same brand? → +30%
2. Price similarity: |price1 - price2| / price1 <= 5%? → +20%
3. Socket match: Same socket? → +20%
4. Use cases overlap: Common use cases? → +10%
5. Other specs: Similar cores/threads? → +20%

// Total: 0-100 score
```

#### Bước 4: Filter & Sort
```javascript
// Loại bỏ:
- Reference product itself
- Products với similarityScore = 0

// Sort by similarityScore descending
// Limit theo limit parameter
// Cache với key: similar:{productId}:{limit}
```

### Điểm đặc biệt
- ✅ **Content-based**: So sánh features của products
- ✅ **Multi-factor similarity**: Brand, price, specs, use cases
- ✅ **Price threshold**: Chỉ coi là similar nếu giá chênh lệch <= 5%

---

## 4. GET /recommendations/personalized - Gợi ý cá nhân hóa

### Mục đích
Gợi ý sản phẩm **cá nhân hóa** dựa trên sở thích và hành vi của user.

### Endpoint
```
GET /recommendations/personalized?userId=123&componentType=cpu&strategy=hybrid&limit=20
```

### Flow hoạt động

#### Strategy Options:
1. **"collaborative"** - Chỉ dùng Collaborative Filtering
2. **"content"** - Chỉ dùng Content-Based Filtering  
3. **"hybrid"** (default) - Kết hợp cả 2

### Strategy 1: Collaborative Filtering

#### Bước 1: Extract User Products
```javascript
// Fetch behavior events từ Identity Service
// Extract products user đã tương tác:
userProducts = Map<productId, score>
// Score = sum of interaction weights
// Loại bỏ products removed >= 3 lần
```

#### Bước 2: Extract User Preferences
```javascript
// Fetch chi tiết 10 products đầu tiên
// Extract preferences:
preferences = {
  brands: Map<brandId, count>,      // Intel: 3, AMD: 2
  categories: Map<categoryId, count>, // CPU: 5, GPU: 3
  priceRange: { min: 3M, max: 10M }, // Q25-Q75
  colors: Set(["black", "white"]),
  useCases: Set(["gaming", "workstation"])
}
```

#### Bước 3: Score All Products
```javascript
// Fetch 30 products từ Product Service
// Score mỗi product:
score = 0
totalWeight = 0

// Brand match (30%):
if (product.brandId in userPreferences.brands) {
  score += (brandCount / maxBrandCount) * 30
}

// Category match (25%):
if (product.categoryId in userPreferences.categories) {
  score += (catCount / maxCatCount) * 25
}

// Price appropriateness (20%):
if (price in priceRange) {
  score += 20
}

// Popularity (15%):
score += min(views / 100, 1) * 15

// Color match (5%):
if (hasMatchingColor) {
  score += 5
}

// Use case match (5%):
if (hasMatchingUseCase) {
  score += 5
}

finalScore = score / totalWeight * 100
```

#### Bước 4: Return Top N
```javascript
// Sort by score descending
// Return top limit products
```

### Strategy 2: Content-Based Filtering

#### Bước 1: Build User Profile
```javascript
// Fetch behavior events (1000 events)
// Fetch orders (nếu có)
// Extract preferences từ products user đã tương tác:

userProfile = {
  preferences: {
    brands: Map<brandId, normalizedWeight>, // 0-1
    categories: Map<categoryId, normalizedWeight>,
    priceRange: { min: 3M, max: 10M },
    colors: ["black", "white"],
    useCases: ["gaming"]
  }
}

// Lưu vào DB (UserPreference model)
// Cache với key: user_pref:{userId}
```

#### Bước 2: Score Products
```javascript
// Fetch 30 products
// Score mỗi product:
score = 0

// Brand score (30%):
if (product.brandId in userProfile.preferences.brands) {
  brandWeight = userProfile.preferences.brands.get(product.brandId)
  score += brandWeight * 30
}

// Category score (30%):
if (product.categoryId in userProfile.preferences.categories) {
  catWeight = userProfile.preferences.categories.get(product.categoryId)
  score += catWeight * 30
}

// Price score (20%):
if (price in priceRange) {
  score += 20
}

// Color score (10%):
if (hasMatchingColor) {
  score += 10
}

// Use case score (10%):
if (hasMatchingUseCase) {
  score += 10
}
```

### Strategy 3: Hybrid (Default)

#### Bước 1: Run Both Strategies in Parallel
```javascript
[collaborativeResults, contentResults] = await Promise.all([
  collaborativeService.getRecommendations(options),
  contentBasedService.getRecommendations(options)
])
```

#### Bước 2: Combine Results
```javascript
// Merge recommendations:
productMap = Map<productId, recommendation>

// Collaborative (60% weight):
collaborativeResults.forEach(rec => {
  if (productMap.has(rec.productId)) {
    existing = productMap.get(rec.productId)
    existing.score = existing.score + rec.score * 0.6
  } else {
    productMap.set(rec.productId, {
      ...rec,
      score: rec.score * 0.6
    })
  }
})

// Content-based (40% weight):
contentResults.forEach(rec => {
  if (productMap.has(rec.productId)) {
    existing = productMap.get(rec.productId)
    existing.score = existing.score + rec.score * 0.4
  } else {
    productMap.set(rec.productId, {
      ...rec,
      score: rec.score * 0.4
    })
  }
})
```

#### Bước 3: Sort & Return
```javascript
// Sort by combined score descending
// Return top limit
```

### Điểm đặc biệt
- ✅ **Multiple strategies**: Collaborative, Content-based, hoặc Hybrid
- ✅ **User profile caching**: Lưu preferences vào DB để tái sử dụng
- ✅ **Weighted combination**: Hybrid kết hợp với weights có thể điều chỉnh
- ✅ **Error handling**: Nếu một strategy fail, vẫn dùng strategy còn lại

---

## 5. POST /recommendations/build-suggestions - Gợi ý build PC

### Mục đích
Gợi ý sản phẩm cho **một component type còn thiếu** trong PC build hiện tại.

### Endpoint
```
POST /recommendations/build-suggestions
Body: {
  currentConfig: {
    cpu: { productId: "123", specifications: {...} },
    ram: { productId: "456", specifications: {...} }
  },
  availableComponentType: "motherboard"
}
```

### Flow hoạt động

#### Bước 1: Validate Input
```javascript
// Check:
- availableComponentType phải là string
- Component type chưa được chọn trong currentConfig
// Nếu đã chọn → return empty suggestions
```

#### Bước 2: Convert Config Format
```javascript
// Convert currentConfig → currentComponents array:
currentComponents = [
  {
    type: "cpu",
    productId: "123",
    product: { _id: "123", specifications: {...} }
  },
  {
    type: "ram", 
    productId: "456",
    product: { _id: "456", specifications: {...} }
  }
]
```

#### Bước 3: Check Cache
```javascript
// Cache key: build_suggestions:{componentsHash}:{componentType}:{limit}
// TTL: 5 phút (300s)
// Nếu cache hit → return ngay
```

#### Bước 4: Get Suggestions
```javascript
// Gọi CompatibilityService.getCompatibleRecommendations()
// Với:
- componentType: "motherboard"
- currentComponents: [cpu, ram]
- limit: 6 (max)

// Flow giống API /compatible:
1. Extract requirements từ currentComponents
2. Two-stage retrieval (nếu enabled)
3. Score và rank candidates
4. Return top 6
```

#### Bước 5: Return Results
```javascript
{
  componentType: "motherboard",
  recommendations: [
    {
      productId: "...",
      product: {...},
      score: 90,
      compatibility: {...},
      reasons: [...]
    },
    ... // Max 6 items
  ],
  currentComponents: [...],
  duration: "120ms",
  fromCache: false
}
```

### Điểm đặc biệt
- ✅ **Single component focus**: Chỉ gợi ý cho 1 component type còn thiếu
- ✅ **Max 6 suggestions**: Giới hạn để không overwhelm user
- ✅ **Reuse compatibility logic**: Tận dụng CompatibilityService
- ✅ **Shorter cache TTL**: 5 phút vì build thay đổi thường xuyên

---

## So sánh các API

| API | Algorithm | Input | Output | Use Case |
|-----|-----------|-------|--------|----------|
| **Compatible** | Compatibility + Two-Stage | Components đã chọn | Top 10 compatible | Chọn component tiếp theo |
| **Favorites** | Behavior-based | User ID | Top 20 favorites | Sản phẩm user quan tâm |
| **Similar** | Content-based similarity | Product ID | Top 10 similar | "Sản phẩm tương tự" |
| **Personalized** | Collaborative + Content | User ID | Top 20 personalized | Trang chủ, gợi ý chung |
| **Build Suggestions** | Compatibility | Current build | Top 6 suggestions | Build PC wizard |

---

## Performance Characteristics

### Compatible API
- **Cache hit**: <10ms
- **Cache miss (Two-stage)**: ~150ms
  - Retrieval: ~50ms
  - Ranking: ~100ms
- **Cache miss (Legacy)**: ~300-600ms

### Favorites API
- **Cache hit**: <10ms
- **Cache miss**: ~200-400ms
  - Fetch behavior: ~100ms
  - Score products: ~100-300ms

### Similar API
- **Cache hit**: <10ms
- **Cache miss**: ~200-300ms
  - Fetch reference: ~50ms
  - Calculate similarity: ~150-250ms

### Personalized API
- **Cache hit**: <10ms
- **Cache miss (Hybrid)**: ~400-800ms
  - Collaborative: ~200-400ms
  - Content-based: ~200-400ms
  - Combine: ~50ms

### Build Suggestions API
- **Cache hit**: <10ms
- **Cache miss**: ~150ms (giống Compatible)

---

## Caching Strategy

### Cache Layers

1. **Final Recommendations Cache**
   - Key: `compatible:{componentType}:{requirementsHash}`
   - TTL: 15 phút (900s)
   - Scope: Compatible, Similar APIs

2. **Product Pool Cache**
   - Key: `product_pool:{componentType}`
   - TTL: 1 giờ (3600s)
   - Scope: CompatibilityService

3. **Build Suggestions Cache**
   - Key: `build_suggestions:{componentsHash}:{componentType}:{limit}`
   - TTL: 5 phút (300s)
   - Scope: BuildSuggestionsService

4. **User Preferences Cache**
   - Key: `user_pref:{userId}`
   - TTL: 30 phút (1800s)
   - Scope: ContentBasedService

5. **Similarity Cache**
   - Key: `similar:{productId}:{limit}`
   - TTL: 15 phút (900s)
   - Scope: SimilarityService

---

## Optimization Features

### Two-Stage Architecture (Compatible API)
- **Stage 1**: Search-service filter → 30 candidates (<50ms)
- **Stage 2**: Score 30 candidates → Top 10 (<100ms)
- **Total**: ~150ms thay vì 600ms (4x faster)

### Batch Processing
- Process products theo batch 50 items
- Parallel processing trong mỗi batch
- Early exit nếu đã có đủ recommendations tốt

### Early Exit Optimization
- Dừng sớm khi có đủ recommendations tốt
- Threshold: 3x target limit
- Giảm processing time 50-70%

---

## Configuration Files

### optimization-config.js
- Điều chỉnh Two-Stage parameters
- Enable/disable features
- Performance thresholds

### recommendation-config.js
- Scoring weights
- Default limits
- Interaction weights
- Time windows

---

## Error Handling

### Fallback Mechanisms
- **Search-service fails**: Fallback về Product Service
- **Collaborative fails**: Dùng Content-based only (nếu hybrid)
- **Content-based fails**: Dùng Collaborative only (nếu hybrid)
- **Cache fails**: Vẫn hoạt động nhưng chậm hơn

### Error Responses
```javascript
{
  success: false,
  error: "Error message",
  message: "User-friendly message"
}
```

---

## Monitoring & Logging

### Logged Metrics
- Request duration
- Cache hit/miss rates
- Products processed
- Recommendations count
- Stage timings (retrieval, ranking)

### Performance Alerts
- Retrieval > 50ms → Warning
- Total latency > 500ms → Alert
- Cache hit rate < 60% → Review

---

## Best Practices

1. **Use caching**: Đảm bảo Redis available
2. **Monitor performance**: Check logs thường xuyên
3. **Adjust limits**: Điều chỉnh trong config files
4. **Enable two-stage**: Cho Compatible API để tăng tốc
5. **Handle errors gracefully**: Fallback mechanisms đã có sẵn
