const segmentationService = require("../services/customerSegmentation.service");
const { ValidationError } = require("../errors");
const identityClient = require("../clients/identity.client");

/**
 * CUSTOMER SEGMENTATION - CÁCH TÍNH ĐIỂM VÀ PHÂN LOẠI
 *
 * ============================================
 * 1. TÍNH TOÁN RFM (Recency, Frequency, Monetary)
 * ============================================
 *
 * **Recency (R)**: Số ngày kể từ lần hoạt động cuối cùng
 *   - Nếu có orders đã completed/paid: dùng ngày tạo order gần nhất
 *   - Nếu không có orders: dùng lastSeenAt
 *   - Nếu không có gì: dùng firstSeenAt
 *
 * **Frequency (F)**: Số lượng orders trong 1 tháng gần nhất
 *   - Chỉ đếm orders có status="completed" hoặc payment.status="paid"
 *   - Tính trong khoảng thời gian 30 ngày gần nhất
 *
 * **Monetary (M)**: Tổng số tiền đã chi trong 1 tháng gần nhất
 *   - Tổng của order.pricing.total từ các orders trong 30 ngày
 *   - Đơn vị: VND
 *
 * ============================================
 * 2. TÍNH ĐIỂM RFM (0-100)
 * ============================================
 *
 * **Công thức**: RFM Score = (R * 0.4) + (F * 0.4) + (M * 0.2)
 *
 * **Chuẩn hóa từng thành phần**:
 *
 * - **Recency Score (0-100)**:
 *   - 0 ngày = 100 điểm
 *   - 90+ ngày = 0 điểm
 *   - Công thức: 100 - (recency * 100/90)
 *   - Recency càng thấp (hoạt động gần đây) → điểm càng cao
 *
 * - **Frequency Score (0-100)**:
 *   - 0 transactions = 0 điểm
 *   - 10+ transactions = 100 điểm
 *   - Công thức: min(100, frequency * 10)
 *   - Frequency càng cao → điểm càng cao
 *
 * - **Monetary Score (0-100)**:
 *   - 0 VND = 0 điểm
 *   - 5,000,000+ VND = 100 điểm
 *   - Công thức: min(100, (monetary / 5,000,000) * 100)
 *   - Monetary càng cao → điểm càng cao
 *
 * ============================================
 * 3. TÍNH TOÁN BEHAVIOR SCORE
 * ============================================
 *
 * **Engagement Score**: Điểm đánh giá mức độ tương tác
 *   - Công thức: (recentImportantEvents * 2) + recentEvents.length
 *   - Important events: ["view", "add_to_cart", "checkout_start", "purchase"]
 *   - Tính trong 7 ngày gần nhất
 *
 * **Days Since Last Activity**: Số ngày từ lần hoạt động cuối
 *   - Lấy từ behavior events nếu không có orders
 *   - Nếu không có events: = 999 (rất lâu)
 *
 * ============================================
 * 4. PHÂN LOẠI KHÁCH HÀNG (Priority Order)
 * ============================================
 *
 * **Thứ tự kiểm tra** (theo độ ưu tiên):
 *
 * 1. 🟡 POTENTIAL - New User (< 14 ngày)
 *    - Điều kiện: daysSinceRegistration < 14
 *    - Score: 50-79
 *    - Lý do: Khách hàng mới, chưa đủ dữ liệu
 *
 * 2. 🟡 POTENTIAL - No Activity
 *    - Điều kiện: totalOrders = 0 AND recentEventCount = 0 AND daysSinceLastActivity >= 999
 *    - Score: 50-79
 *    - Lý do: Chưa có hoạt động nào được ghi nhận
 *
 * 3. 🔴 CHURNED - Extended Inactivity (> 90 ngày)
 *    - Điều kiện:
 *      - daysSinceRegistration >= 14
 *      - daysSinceLastActivity >= 90
 *      - totalOrders > 0 (đã từng có hoạt động)
 *    - Score: 0-29
 *    - Lý do: Không hoạt động trong thời gian dài
 *
 * 4. 🟢 LOYAL - High Value Customer
 *    - Điều kiện (Option 1):
 *      - daysSinceRegistration >= 14
 *      - daysSinceLastActivity <= 7
 *      - frequency >= 10 orders/tháng
 *      - monetary >= 5,000,000 VND/tháng
 *    - Điều kiện (Option 2):
 *      - daysSinceRegistration >= 14
 *      - daysSinceLastActivity <= 7
 *      - frequency >= 10 orders/tháng
 *      - engagementScore >= 20
 *    - Score: 80-100
 *    - Lý do: Khách hàng trung thành, hoạt động tích cực
 *
 * 5. 🟠 AT_RISK - Declining Engagement (14-30 ngày)
 *    - Điều kiện (Option 1):
 *      - daysSinceRegistration >= 14
 *      - daysSinceLastActivity >= 14 AND < 30
 *      - totalOrders > 0
 *    - Điều kiện (Option 2):
 *      - daysSinceRegistration >= 14
 *      - effectiveRecency >= 14 AND < 90
 *      - totalOrders >= 3
 *    - Score: 30-49
 *    - Lý do: Hoạt động giảm, có nguy cơ rời bỏ
 *
 * 6. 🟡 POTENTIAL - Recent Activity, Low Purchase
 *    - Điều kiện:
 *      - daysSinceRegistration >= 14
 *      - daysSinceLastActivity <= 14
 *      - frequency <= 1
 *      - recentImportantEventCount > 0 OR engagementScore > 10
 *    - Score: 50-79
 *    - Lý do: Có hoạt động nhưng chưa mua nhiều
 *
 * 7. 🟡 POTENTIAL - Default (các trường hợp còn lại)
 *    - Score: 50-79
 *    - Lý do: Hoạt động vừa phải, chưa đủ tiêu chí cho các segment khác
 *
 * ============================================
 * 5. THRESHOLDS (Ngưỡng)
 * ============================================
 *
 * - LOYAL_RECENCY: 7 ngày (hoạt động trong 7 ngày = rất gần đây)
 * - POTENTIAL_RECENCY: 14 ngày (khách hàng mới < 14 ngày)
 * - AT_RISK_START: 14 ngày (bắt đầu có nguy cơ)
 * - AT_RISK_END: 30 ngày (kết thúc nguy cơ)
 * - CHURN_THRESHOLD: 90 ngày (không hoạt động > 90 ngày = churned)
 * - HIGH_FREQUENCY: 10 orders/tháng
 * - HIGH_MONETARY: 5,000,000 VND/tháng
 * - MIN_FREQUENCY_LOYAL: 10 orders/tháng
 *
 * ============================================
 * 6. SCORE RANGES (Khoảng điểm)
 * ============================================
 *
 * - CHURNED: 0-29
 * - AT_RISK: 30-49
 * - POTENTIAL: 50-79
 * - LOYAL: 80-100
 */

// Analyze single customer segmentation by userId
const analyzeCustomer = async (req, res, next) => {
  try {
    const { customerId } = req.params; // This is actually userId now
    const { forceUpdate } = req.query;

    const segmentation = await segmentationService.analyzeCustomer(customerId, {
      forceUpdate: forceUpdate === "true",
    });

    res.json({
      status: "success",
      data: segmentation,
    });
  } catch (error) {
    next(error);
  }
};

// Analyze multiple customers (batch)
const analyzeCustomers = async (req, res, next) => {
  try {
    const { customerIds } = req.body;
    const { forceUpdate, batchSize } = req.query;

    if (!Array.isArray(customerIds) || customerIds.length === 0) {
      throw new ValidationError("customerIds phải là một mảng không rỗng");
    }

    const results = await segmentationService.analyzeCustomers(customerIds, {
      forceUpdate: forceUpdate === "true",
      batchSize: parseInt(batchSize) || 10,
    });

    res.json({
      status: "success",
      data: {
        results,
        total: results.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get segmentation statistics
// Optionally re-analyzes all customers before returning stats (default: false)
const getSegmentationStats = async (req, res, next) => {
  try {
    const { forceReAnalyze = "false", batchSize } = req.query;

    const stats = await segmentationService.getSegmentationStats({
      forceReAnalyze: forceReAnalyze === "true",
      batchSize: batchSize ? parseInt(batchSize) : 10,
    });

    res.json({
      status: "success",
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};

// Analyze all customers (no limit, sorted by updatedAt)
const analyzeAllCustomers = async (req, res, next) => {
  try {
    const { forceUpdate = "true", batchSize } = req.query;
console.log("vao day1");
    const result = await segmentationService.analyzeAllCustomers({
      forceUpdate: forceUpdate === "true",
      batchSize: batchSize ? parseInt(batchSize) : 10,
    });

    res.json({
      status: "success",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// Get customers by segmentation type
// Returns users (only registered customers with userId) filtered by segmentation type
const getCustomersBySegment = async (req, res, next) => {
  try {
    const { type } = req.params;
    const { page = 1, limit = 1000 } = req.query;

    const validTypes = ["potential", "loyal", "at_risk", "churned"];
    if (!validTypes.includes(type)) {
      throw new ValidationError(
        `Loại phân loại không hợp lệ. Phải là một trong: ${validTypes.join(
          ", "
        )}`
      );
    }

    // Call identity-service to get users by segmentation type
    const result = await identityClient.getUsersBySegmentationType(type, {
      page: parseInt(page),
      limit: parseInt(limit),
    });

    res.json({
      status: "success",
      data: {
        users: result.users || [],
        customers: result.users || [], // For backward compatibility
        pagination: result.pagination || {
          current: parseInt(page),
          pageSize: parseInt(limit),
          total: result.users?.length || 0,
          pages: 1,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  analyzeCustomer,
  analyzeCustomers,
  analyzeAllCustomers,
  getSegmentationStats,
  getCustomersBySegment,
};
