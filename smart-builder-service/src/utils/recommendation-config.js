/**
 * Recommendation System Configuration
 * Tất cả các giá trị ranh giới và config tính toán cho recommendation system
 *
 * Bạn có thể điều chỉnh các giá trị này để phù hợp với business logic của mình
 */

module.exports = {
  // ============================================
  // DEFAULT LIMITS (Giới hạn mặc định)
  // ============================================
  DEFAULT_LIMITS: {
    // Số lượng sản phẩm được recommend mặc định cho personalized recommendations
    PERSONALIZED_RECOMMENDATIONS: 20,

    // Số lượng sản phẩm được recommend mặc định cho favorite products
    FAVORITE_PRODUCTS: 20,

    // Số lượng sản phẩm tương tự được recommend mặc định
    SIMILAR_PRODUCTS: 10,

    // Số lượng sản phẩm compatible được recommend mặc định
    COMPATIBLE_PRODUCTS: 10,

    // Số lượng sản phẩm để fetch từ product service để filter và score
    PRODUCT_FETCH_LIMIT: 30,
  },

  // ============================================
  // TIME WINDOWS (Khoảng thời gian)
  // ============================================
  TIME_WINDOWS: {
    // Khoảng thời gian mặc định để tính favorite products (ngày)
    // Chỉ tính các events trong khoảng thời gian này
    FAVORITE_PRODUCTS_DAYS: 30,

    // Khoảng thời gian để tính recency multiplier trong favorite score
    // Events càng gần đây thì điểm càng cao
    FAVORITE_RECENCY_WINDOW: 30,
  },

  // ============================================
  // INTERACTION WEIGHTS (Trọng số tương tác)
  // ============================================
  // Điểm số cho từng loại event khi tính favorite score
  // Giá trị âm sẽ làm giảm điểm số
  INTERACTION_WEIGHTS: {
    view: 1, // Xem sản phẩm
    click: 2, // Click vào sản phẩm
    add_to_cart: 3, // Thêm vào giỏ hàng
    remove_from_cart: -2, // Xóa khỏi giỏ hàng (giảm điểm)
    purchase: 5, // Mua hàng (điểm cao nhất)
  },

  // ============================================
  // FAVORITE PRODUCTS CONFIG
  // ============================================
  FAVORITE: {
    // Số lần remove_from_cart tối đa để vẫn được recommend
    // Nếu remove >= số này, sản phẩm sẽ bị loại bỏ hoàn toàn
    MAX_REMOVE_COUNT: 3,

    // Nếu remove_count > add_to_cart_count và remove_count >= số này, loại bỏ
    REMOVE_THRESHOLD: 2,

    // Penalty cho mỗi lần remove (giảm điểm)
    // Công thức: score * (1 - penalty)
    // Penalty tối đa là 60% (0.6)
    REMOVE_PENALTY_PER_EVENT: 0.2, // 20% mỗi lần remove

    // Recency multiplier cho favorite score
    // Công thức: 1 + (1 - daysAgo / timeWindow) * RECENCY_MULTIPLIER
    RECENCY_MULTIPLIER: 0.5,
  },

  // ============================================
  // CONTENT-BASED FILTERING CONFIG
  // ============================================
  CONTENT_BASED: {
    // Trọng số cho từng thành phần khi tính điểm sản phẩm
    // Tổng các trọng số = 100%
    SCORING_WEIGHTS: {
      brand: 30, // Trọng số cho brand match (%)
      category: 30, // Trọng số cho category match (%)
      price: 20, // Trọng số cho price appropriateness (%)
      color: 10, // Trọng số cho color match (%)
      useCase: 10, // Trọng số cho use case match (%)
    },

    // Số lần remove_from_cart để loại bỏ sản phẩm khỏi learning preferences
    // Nếu sản phẩm bị remove >= số này, không học preferences từ sản phẩm đó
    MAX_REMOVE_FOR_LEARNING: 3,

    // Giảm trọng số khi sản phẩm đã bị remove (nhưng vẫn học)
    // Nếu removeCount > 0, weight = weight * REMOVED_WEIGHT_REDUCTION
    REMOVED_WEIGHT_REDUCTION: 0.5, // Giảm 50% trọng số

    // Số lượng behavior events để fetch khi build user profile
    BEHAVIOR_EVENTS_LIMIT: 1000,
  },

  // ============================================
  // COLLABORATIVE FILTERING CONFIG
  // ============================================
  COLLABORATIVE: {
    // Trọng số cho từng thành phần khi tính điểm sản phẩm
    // Tổng các trọng số = 100%
    SCORING_WEIGHTS: {
      brand: 30, // Trọng số cho brand match (%)
      category: 25, // Trọng số cho category match (%)
      price: 20, // Trọng số cho price appropriateness (%)
      popularity: 15, // Trọng số cho popularity (%)
      color: 5, // Trọng số cho color match (%)
      useCase: 5, // Trọng số cho use case match (%)
    },

    // Số lượng sản phẩm của user để fetch chi tiết để hiểu preferences
    // Giới hạn để tránh quá nhiều API calls
    USER_PRODUCTS_FETCH_LIMIT: 10,

    // Số lần remove_from_cart để loại bỏ sản phẩm hoàn toàn
    MAX_REMOVE_COUNT: 3,

    // Số lượng behavior events để fetch
    BEHAVIOR_EVENTS_LIMIT: 500,
  },

  // ============================================
  // COMPATIBILITY FILTERING CONFIG
  // ============================================
  COMPATIBILITY: {
    // Trọng số cho từng thành phần khi tính điểm compatible
    // Tổng các trọng số = 1.0
    SCORING_WEIGHTS: {
      compatibility: 0.5, // Trọng số cho compatibility match (50%)
      price: 0.2, // Trọng số cho price appropriateness (20%)
      brand: 0.2, // Trọng số cho brand preference (20%)
      popularity: 0.1, // Trọng số cho popularity (10%)
    },

    // Overhead cho power requirement khi tính PSU
    // Công thức: totalPower * (1 + POWER_OVERHEAD)
    POWER_OVERHEAD: 0.2, // Thêm 20% overhead

    // Số lượng sản phẩm để fetch để filter và score
    PRODUCT_FETCH_LIMIT: 30,
  },

  // ============================================
  // HYBRID STRATEGY CONFIG
  // ============================================
  // Khi dùng strategy='hybrid', kết hợp collaborative và content-based
  HYBRID: {
    // Trọng số cho collaborative filtering (0-1)
    // Công thức: finalScore = collaborativeScore * COLLABORATIVE_WEIGHT + contentScore * CONTENT_WEIGHT
    COLLABORATIVE_WEIGHT: 0.6, // 60%

    // Trọng số cho content-based filtering (0-1)
    CONTENT_WEIGHT: 0.4, // 40%

    // Lưu ý: COLLABORATIVE_WEIGHT + CONTENT_WEIGHT = 1.0
  },

  // ============================================
  // SIMILARITY FILTERING CONFIG
  // ============================================
  SIMILARITY: {
    // Ngưỡng chênh lệch giá để coi là similar (phần trăm)
    // Công thức: |price1 - price2| / price1 * 100 <= PRICE_DIFF_THRESHOLD
    PRICE_DIFF_THRESHOLD: 5, // 5%

    // Số lượng sản phẩm để fetch từ product service
    PRODUCT_FETCH_LIMIT: 30,
  },

  // ============================================
  // BEHAVIOR DATA CONFIG
  // ============================================
  BEHAVIOR: {
    // Số lượng events tối đa để fetch từ identity service
    // Dùng cho favorite, content-based, collaborative
    MAX_EVENTS_LIMIT: 1000,

    // Số lượng events để fetch cho collaborative (nhỏ hơn vì chỉ cần patterns)
    COLLABORATIVE_EVENTS_LIMIT: 500,
  },

  // ============================================
  // PRODUCT FILTERING CONFIG
  // ============================================
  PRODUCT_FILTERING: {
    // Chỉ recommend các sản phẩm có status này
    REQUIRED_STATUS: "published",

    // Chỉ recommend các sản phẩm có isActive = true
    REQUIRED_ACTIVE: true,
  },

  // ============================================
  // CACHE CONFIG
  // ============================================
  CACHE: {
    // Cache key prefix cho recommendations
    KEY_PREFIX: "rec",

    // Cache key prefix cho user preferences
    USER_PREFERENCE_PREFIX: "user_pref",

    // Cache key prefix cho similarity
    SIMILARITY_PREFIX: "similar",
  },

  // ============================================
  // SCORING THRESHOLDS (Ngưỡng điểm số)
  // ============================================
  SCORING: {
    // Điểm tối thiểu để sản phẩm được recommend
    // Nếu score < MIN_SCORE, sản phẩm sẽ bị loại bỏ
    MIN_SCORE: 0,

    // Điểm tối đa có thể đạt được (100 = perfect match)
    MAX_SCORE: 100,

    // Điểm trung bình (neutral) khi không có đủ dữ liệu
    NEUTRAL_SCORE: 50,
  },

  // ============================================
  // POPULARITY CONFIG
  // ============================================
  POPULARITY: {
    // Normalize popularity score
    // Công thức: min((views / NORMALIZATION_FACTOR), 1) * weight
    NORMALIZATION_FACTOR: 100, // 100 views = 1.0 score

    // Hoặc cho compatibility service
    COMPATIBILITY_NORMALIZATION: 1000, // 1000 views = 1.0 score
  },

  // ============================================
  // ERROR HANDLING CONFIG
  // ============================================
  ERROR_HANDLING: {
    // Nếu một strategy fail trong hybrid mode, có dùng empty results không?
    USE_EMPTY_ON_ERROR: true,

    // Message khi không đủ dữ liệu cho content-based
    INSUFFICIENT_DATA_MESSAGE: "Insufficient data for content-based filtering",

    // Message khi không đủ dữ liệu cho collaborative
    INSUFFICIENT_DATA_COLLABORATIVE:
      "Insufficient data for collaborative filtering",
  },

  // ============================================
  // STRATEGY OPTIONS
  // ============================================
  STRATEGIES: {
    // Các strategy có sẵn
    HYBRID: "hybrid", // Kết hợp collaborative và content-based
    COLLABORATIVE: "collaborative", // Chỉ dùng collaborative filtering
    CONTENT: "content", // Chỉ dùng content-based filtering

    // Strategy mặc định
    DEFAULT: "hybrid",
  },
};
