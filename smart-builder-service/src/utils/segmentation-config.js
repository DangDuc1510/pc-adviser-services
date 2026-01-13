/**
 * Customer Segmentation Configuration
 * Tất cả các giá trị ranh giới và config tính toán cho customer segmentation
 *
 * Bạn có thể điều chỉnh các giá trị này để phù hợp với business logic của mình
 */

module.exports = {
  // ============================================
  // SEGMENTATION TYPES
  // ============================================
  SEGMENTATION_TYPES: {
    POTENTIAL: "potential",
    LOYAL: "loyal",
    AT_RISK: "at_risk",
    CHURNED: "churned",
  },

  // ============================================
  // TIME THRESHOLDS (in days)
  // ============================================
  TIME_THRESHOLDS: {
    // Số ngày để xác định khách hàng hoạt động gần đây (LOYAL)
    LOYAL_RECENCY: 7,

    // Số ngày để xác định khách hàng mới (POTENTIAL)
    POTENTIAL_RECENCY: 14,

    // Bắt đầu khoảng thời gian có nguy cơ (AT_RISK)
    AT_RISK_START: 14,

    // Kết thúc khoảng thời gian có nguy cơ (AT_RISK)
    AT_RISK_END: 30,

    // Ngưỡng để xác định khách hàng đã rời bỏ (CHURNED)
    CHURN_THRESHOLD: 90,

    // Khoảng thời gian phân tích cho Frequency và Monetary (tháng)
    ANALYSIS_PERIOD_MONTHS: 1,
  },

  // ============================================
  // RFM THRESHOLDS
  // ============================================
  RFM_THRESHOLDS: {
    // Số giao dịch/tháng để được coi là tần suất cao
    HIGH_FREQUENCY: 10,

    // Số tiền (VND)/tháng để được coi là chi tiêu cao
    HIGH_MONETARY: 5000000, // 5 triệu VND

    // Tần suất tối thiểu để được phân loại LOYAL
    MIN_FREQUENCY_LOYAL: 10,
  },

  // ============================================
  // RFM SCORING WEIGHTS
  // ============================================
  RFM_SCORING: {
    // Trọng số cho từng thành phần RFM (tổng = 1.0)
    WEIGHTS: {
      RECENCY: 0.4, // Trọng số cho Recency
      FREQUENCY: 0.4, // Trọng số cho Frequency
      MONETARY: 0.2, // Trọng số cho Monetary
    },

    // Chuẩn hóa Recency Score
    // Công thức: 100 - (recency * (100 / RECENCY_MAX_DAYS))
    RECENCY_MAX_DAYS: 90, // Số ngày tối đa để tính recency score (90 ngày = 0 điểm)

    // Chuẩn hóa Frequency Score
    // Công thức: min(100, frequency * FREQUENCY_MULTIPLIER)
    FREQUENCY_MULTIPLIER: 10, // Nhân với số này để đạt 100 điểm (10 transactions = 100 điểm)
  },

  // ============================================
  // SCORE RANGES (Khoảng điểm cho từng segment)
  // ============================================
  SCORE_RANGES: {
    CHURNED: {
      MIN: 0,
      MAX: 29,
    },
    AT_RISK: {
      MIN: 30,
      MAX: 49,
    },
    POTENTIAL: {
      MIN: 50,
      MAX: 79,
    },
    LOYAL: {
      MIN: 80,
      MAX: 100,
    },
  },

  // ============================================
  // BEHAVIOR SCORING CONFIG
  // ============================================
  BEHAVIOR: {
    // Các loại event quan trọng (cho thấy ý định mua hàng)
    IMPORTANT_EVENTS: ["view", "add_to_cart", "checkout_start", "purchase"],

    // Trọng số cho important events khi tính engagement score
    // Công thức: (recentImportantEvents * IMPORTANT_EVENT_WEIGHT) + recentEvents.length
    IMPORTANT_EVENT_WEIGHT: 2,

    // Ngưỡng engagement score để được phân loại LOYAL (alternative criteria)
    MIN_ENGAGEMENT_SCORE_LOYAL: 20,

    // Ngưỡng engagement score để được phân loại POTENTIAL (recent activity)
    MIN_ENGAGEMENT_SCORE_POTENTIAL: 10,

    // Giá trị mặc định cho daysSinceLastActivity khi không có activity
    NO_ACTIVITY_DAYS: 999,
  },

  // ============================================
  // CLASSIFICATION THRESHOLDS
  // ============================================
  CLASSIFICATION: {
    // Tần suất tối đa để được phân loại POTENTIAL (recent activity, low purchase)
    MAX_FREQUENCY_POTENTIAL_LOW: 1,

    // Tần suất tối đa để được phân loại POTENTIAL (some activity, low purchases)
    MAX_FREQUENCY_POTENTIAL_SOME: 2,

    // Số đơn hàng tối thiểu để được phân loại AT_RISK (had frequency before)
    MIN_ORDERS_AT_RISK: 3,

    // Số đơn hàng tối thiểu để được phân loại CHURNED (must have had activity)
    MIN_ORDERS_CHURNED: 1, // > 0
  },

  // ============================================
  // CACHE CONFIG
  // ============================================
  CACHE: {
    // Số ngày để cache kết quả segmentation (không phân tích lại nếu < số ngày này)
    CACHE_DAYS: 5,
  },

  // ============================================
  // BATCH PROCESSING CONFIG
  // ============================================
  BATCH: {
    // Kích thước batch mặc định khi phân tích nhiều customers
    DEFAULT_BATCH_SIZE: 10,

    // Giới hạn số lượng orders để fetch
    MAX_ORDERS_LIMIT: 1000,

    // Giới hạn số lượng behavior events để fetch
    MAX_BEHAVIOR_EVENTS_LIMIT: 1000,
  },
};
