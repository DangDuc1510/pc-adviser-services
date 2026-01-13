const identityClient = require("../clients/identity.client");
const orderClient = require("../clients/order.client");
const voucherClient = require("../clients/voucher.client");
const { NotFoundError } = require("../errors");
const config = require("../utils/segmentation-config");

// Import config values
const SEGMENTATION_TYPES = config.SEGMENTATION_TYPES;
const TIME_THRESHOLDS = config.TIME_THRESHOLDS;
const RFM_THRESHOLDS = config.RFM_THRESHOLDS;
const RFM_SCORING = config.RFM_SCORING;
const SCORE_RANGES = config.SCORE_RANGES;
const BEHAVIOR_CONFIG = config.BEHAVIOR;
const CLASSIFICATION = config.CLASSIFICATION;
const CACHE_CONFIG = config.CACHE;
const BATCH_CONFIG = config.BATCH;

/**
 * Calculate RFM scores for a customer
 * RFM = Recency (last activity) + Frequency (transactions/month) + Monetary (value/month)
 * @param {Object} customer - Customer object
 * @param {Array} orders - Array of orders
 * @param {Date} analysisDate - Date to analyze from
 * @returns {Object} RFM scores
 */
const calculateRFM = (customer, orders, analysisDate = new Date()) => {
  const completedOrders = orders.filter(
    (order) => order.status === "completed" || order.payment?.status === "paid"
  );

  // Recency (R): Days since last activity (order or lastSeenAt)
  let recency = null;
  let lastActivityDate = null;

  if (completedOrders.length > 0) {
    lastActivityDate = new Date(
      Math.max(
        ...completedOrders.map((o) => new Date(o.createdAt || o.created_at))
      )
    );
    recency = Math.floor(
      (analysisDate - lastActivityDate) / (1000 * 60 * 60 * 24)
    );
  } else {
    // If no orders, use lastSeenAt
    const lastSeen = customer.lastSeenAt ? new Date(customer.lastSeenAt) : null;
    if (lastSeen) {
      lastActivityDate = lastSeen;
      recency = Math.floor((analysisDate - lastSeen) / (1000 * 60 * 60 * 24));
    } else {
      // No activity at all
      lastActivityDate = customer.firstSeenAt
        ? new Date(customer.firstSeenAt)
        : analysisDate;
      recency = Math.floor(
        (analysisDate - lastActivityDate) / (1000 * 60 * 60 * 24)
      );
    }
  }

  // Frequency (F): Number of orders in last 1 month
  const oneMonthAgo = new Date(analysisDate);
  oneMonthAgo.setMonth(
    oneMonthAgo.getMonth() - TIME_THRESHOLDS.ANALYSIS_PERIOD_MONTHS
  );

  const recentOrders = completedOrders.filter((order) => {
    const orderDate = new Date(order.createdAt || order.created_at);
    return orderDate >= oneMonthAgo;
  });
  const frequency = recentOrders.length;

  // Monetary (M): Total spent in last 1 month
  const monetary = recentOrders.reduce((sum, order) => {
    return sum + (order.pricing?.total || order.total || 0);
  }, 0);

  return {
    recency,
    frequency,
    monetary,
    lastActivityDate,
    totalOrders: completedOrders.length,
  };
};

/**
 * Calculate behavior score based on activity
 * Used to supplement RFM analysis, especially for users without orders
 * @param {Array} behaviorEvents - Array of behavior events
 * @param {Date} analysisDate - Date to analyze from
 * @returns {Object} Behavior metrics
 */
const calculateBehaviorScore = (behaviorEvents, analysisDate = new Date()) => {
  const sevenDaysAgo = new Date(analysisDate);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - TIME_THRESHOLDS.LOYAL_RECENCY);

  const fourteenDaysAgo = new Date(analysisDate);
  fourteenDaysAgo.setDate(
    fourteenDaysAgo.getDate() - TIME_THRESHOLDS.POTENTIAL_RECENCY
  );

  const recentEvents = behaviorEvents.filter((event) => {
    const eventDate = new Date(event.timestamp);
    return eventDate >= sevenDaysAgo;
  });

  const potentialPeriodEvents = behaviorEvents.filter((event) => {
    const eventDate = new Date(event.timestamp);
    return eventDate >= fourteenDaysAgo;
  });

  // Count important events (indicating purchase intent)
  const importantEvents = BEHAVIOR_CONFIG.IMPORTANT_EVENTS;
  const recentImportantEvents = recentEvents.filter((e) =>
    importantEvents.includes(e.eventType)
  ).length;

  const potentialPeriodImportantEvents = potentialPeriodEvents.filter((e) =>
    importantEvents.includes(e.eventType)
  ).length;

  // Calculate engagement score (weighted by event importance)
  const engagementScore =
    recentImportantEvents * BEHAVIOR_CONFIG.IMPORTANT_EVENT_WEIGHT +
    recentEvents.length;

  // Last activity date
  const lastEvent =
    behaviorEvents.length > 0
      ? new Date(Math.max(...behaviorEvents.map((e) => new Date(e.timestamp))))
      : null;

  const daysSinceLastActivity = lastEvent
    ? Math.floor((analysisDate - lastEvent) / (1000 * 60 * 60 * 24))
    : BEHAVIOR_CONFIG.NO_ACTIVITY_DAYS;

  return {
    recentEventCount: recentEvents.length,
    potentialPeriodEventCount: potentialPeriodEvents.length,
    recentImportantEventCount: recentImportantEvents,
    potentialPeriodImportantEventCount: potentialPeriodImportantEvents,
    engagementScore,
    lastActivityDate: lastEvent,
    daysSinceLastActivity,
  };
};

/**
 * Calculate RFM score (0-100) based on weighted RFM values
 * Score = R * 0.4 + F * 0.4 + M * 0.2
 * @param {Object} rfm - RFM scores
 * @returns {Number} RFM score (0-100)
 */
const calculateRFMScore = (rfm) => {
  const { recency, frequency, monetary } = rfm;

  // Normalize Recency score (0-100): Lower recency = higher score
  // 0 days = 100, RECENCY_MAX_DAYS+ days = 0
  const recencyValue =
    recency !== null && recency !== undefined ? recency : 999;
  const recencyScore = Math.max(
    0,
    100 - recencyValue * (100 / RFM_SCORING.RECENCY_MAX_DAYS)
  );

  // Normalize Frequency score (0-100): Higher frequency = higher score
  // 0 transactions = 0, HIGH_FREQUENCY+ transactions = 100
  const frequencyValue = frequency || 0;
  const frequencyScore = Math.min(
    100,
    frequencyValue * RFM_SCORING.FREQUENCY_MULTIPLIER
  );

  // Normalize Monetary score (0-100): Higher monetary = higher score
  // 0 VND = 0, HIGH_MONETARY+ VND = 100
  const monetaryValue = monetary || 0;
  const monetaryScore = Math.min(
    100,
    (monetaryValue / RFM_THRESHOLDS.HIGH_MONETARY) * 100
  );

  // Weighted RFM score
  const rfmScore =
    recencyScore * RFM_SCORING.WEIGHTS.RECENCY +
    frequencyScore * RFM_SCORING.WEIGHTS.FREQUENCY +
    monetaryScore * RFM_SCORING.WEIGHTS.MONETARY;

  const roundedScore = Math.round(rfmScore);

  // Debug logging
  console.log(`[RFM Score Calculation]`, {
    input: { recency, frequency, monetary },
    normalized: {
      recencyScore: Math.round(recencyScore * 100) / 100,
      frequencyScore: Math.round(frequencyScore * 100) / 100,
      monetaryScore: Math.round(monetaryScore * 100) / 100,
    },
    weights: RFM_SCORING.WEIGHTS,
    finalScore: roundedScore,
  });

  return roundedScore;
};

/**
 * Classify customer into segmentation type based on RFM model
 * Priority: NEW_USER_CHECK > CHURNED > LOYAL > AT_RISK > POTENTIAL
 *
 * IMPORTANT: New users (< 14 days) ALWAYS classified as POTENTIAL
 * They should NEVER be classified as LOYAL, AT_RISK, or CHURNED
 *
 * @param {Object} rfm - RFM scores
 * @param {Object} behavior - Behavior metrics
 * @param {Object} customer - Customer object
 * @param {Date} analysisDate - Date to analyze from
 * @returns {Object} Segmentation result
 */
const classifyCustomer = (
  rfm,
  behavior,
  customer,
  analysisDate = new Date()
) => {
  const { recency, frequency, monetary, totalOrders } = rfm;
  const { daysSinceLastActivity, engagementScore, recentImportantEventCount } =
    behavior;

  // Calculate days since registration
  const daysSinceRegistration = customer.firstSeenAt
    ? Math.floor(
        (analysisDate - new Date(customer.firstSeenAt)) / (1000 * 60 * 60 * 24)
      )
    : 999;

  // Use behavior daysSinceLastActivity if recency is not available
  const effectiveRecency = recency !== null ? recency : daysSinceLastActivity;

  // Calculate RFM score for advanced classification
  const rfmScore = calculateRFMScore(rfm);

  // 🟡 POTENTIAL: NEW USER CHECK - Must be checked FIRST
  // New users (< 14 days) ALWAYS classified as POTENTIAL
  // They should NEVER be classified as LOYAL, AT_RISK, or CHURNED
  if (daysSinceRegistration < TIME_THRESHOLDS.POTENTIAL_RECENCY) {
    return {
      type: SEGMENTATION_TYPES.POTENTIAL,
      score: Math.max(
        SCORE_RANGES.POTENTIAL.MIN,
        Math.min(SCORE_RANGES.POTENTIAL.MAX, rfmScore)
      ),
      reasons: [
        `Khách hàng mới (đăng ký ${daysSinceRegistration} ngày trước)`,
        totalOrders === 0
          ? "Chưa có lịch sử mua hàng"
          : `Giai đoạn đầu: ${totalOrders} đơn hàng`,
        // "Chưa đủ dữ liệu để phân loại vào các segment khác",
      ],
    };
  }

  // 🟡 POTENTIAL: No activity at all (even if registered > 14 days)
  // Users with zero activity should be POTENTIAL, not CHURNED
  if (
    totalOrders === 0 &&
    behavior.recentEventCount === 0 &&
    daysSinceLastActivity >= BEHAVIOR_CONFIG.NO_ACTIVITY_DAYS
  ) {
    return {
      type: SEGMENTATION_TYPES.POTENTIAL,
      score: Math.max(
        SCORE_RANGES.POTENTIAL.MIN,
        Math.min(SCORE_RANGES.POTENTIAL.MAX, rfmScore)
      ),
      reasons: [
        `Đăng ký ${daysSinceRegistration} ngày trước`,
        "Chưa có hoạt động nào được ghi nhận",
        "Đang chờ tương tác đầu tiên",
      ],
    };
  }

  // 🔴 CHURNED: No activity for extended period (> 90 days)
  // BUT only if user has been registered long enough and had previous activity
  if (
    daysSinceRegistration >= TIME_THRESHOLDS.POTENTIAL_RECENCY &&
    daysSinceLastActivity >= TIME_THRESHOLDS.CHURN_THRESHOLD &&
    totalOrders >= CLASSIFICATION.MIN_ORDERS_CHURNED
  ) {
    return {
      type: SEGMENTATION_TYPES.CHURNED,
      score: Math.max(
        SCORE_RANGES.CHURNED.MIN,
        Math.min(SCORE_RANGES.CHURNED.MAX, rfmScore)
      ),
      reasons: [
        `Không hoạt động trong ${daysSinceLastActivity} ngày`,
        `Lịch sử mua hàng trước đó: ${totalOrders} đơn hàng`,
        "Thời gian không hoạt động kéo dài",
      ],
    };
  }

  // 🟢 LOYAL: Very recent activity (<= 7 days) + High frequency (>= 10/month) + High monetary
  // BUT only if user has been registered long enough (>= 14 days)
  if (
    daysSinceRegistration >= TIME_THRESHOLDS.POTENTIAL_RECENCY &&
    daysSinceLastActivity <= TIME_THRESHOLDS.LOYAL_RECENCY &&
    frequency >= RFM_THRESHOLDS.MIN_FREQUENCY_LOYAL &&
    monetary >= RFM_THRESHOLDS.HIGH_MONETARY
  ) {
    return {
      type: SEGMENTATION_TYPES.LOYAL,
      score: Math.max(
        SCORE_RANGES.LOYAL.MIN,
        Math.min(SCORE_RANGES.LOYAL.MAX, rfmScore)
      ),
      reasons: [
        `Hoạt động trong ${daysSinceLastActivity} ngày gần đây`,
        `Tần suất cao: ${frequency} giao dịch/tháng`,
        `Chi tiêu cao: ${Math.round(monetary / 1000000)}M VND/tháng`,
      ],
    };
  }

  // 🟢 LOYAL: Regular customers with good engagement (alternative criteria)
  // BUT only if user has been registered long enough (>= 14 days)
  if (
    daysSinceRegistration >= TIME_THRESHOLDS.POTENTIAL_RECENCY &&
    daysSinceLastActivity <= TIME_THRESHOLDS.LOYAL_RECENCY &&
    frequency >= RFM_THRESHOLDS.MIN_FREQUENCY_LOYAL &&
    engagementScore >= BEHAVIOR_CONFIG.MIN_ENGAGEMENT_SCORE_LOYAL
  ) {
    return {
      type: SEGMENTATION_TYPES.LOYAL,
      score: Math.max(
        SCORE_RANGES.LOYAL.MIN,
        Math.min(SCORE_RANGES.LOYAL.MAX, rfmScore)
      ),
      reasons: [
        `Hoạt động trong ${daysSinceLastActivity} ngày gần đây`,
        `Tần suất cao: ${frequency} giao dịch/tháng`,
        `Điểm tương tác tốt: ${engagementScore}`,
      ],
    };
  }

  // 🟠 AT_RISK: Declining activity (14-30 days) + Had good history before
  // BUT only if user has been registered long enough (>= 14 days)
  if (
    daysSinceRegistration >= TIME_THRESHOLDS.POTENTIAL_RECENCY &&
    daysSinceLastActivity >= TIME_THRESHOLDS.AT_RISK_START &&
    daysSinceLastActivity < TIME_THRESHOLDS.AT_RISK_END &&
    totalOrders >= CLASSIFICATION.MIN_ORDERS_CHURNED
  ) {
    return {
      type: SEGMENTATION_TYPES.AT_RISK,
      score: Math.max(
        SCORE_RANGES.AT_RISK.MIN,
        Math.min(SCORE_RANGES.AT_RISK.MAX, rfmScore)
      ),
      reasons: [
        `Không hoạt động trong ${daysSinceLastActivity} ngày`,
        `Lịch sử mua hàng trước đó: ${totalOrders} đơn hàng`,
        "Mức độ tương tác giảm",
      ],
    };
  }

  // 🟠 AT_RISK: Had frequency before but now inactive
  // BUT only if user has been registered long enough (>= 14 days)
  if (
    daysSinceRegistration >= TIME_THRESHOLDS.POTENTIAL_RECENCY &&
    effectiveRecency >= TIME_THRESHOLDS.AT_RISK_START &&
    effectiveRecency < TIME_THRESHOLDS.CHURN_THRESHOLD &&
    totalOrders >= CLASSIFICATION.MIN_ORDERS_AT_RISK
  ) {
    return {
      type: SEGMENTATION_TYPES.AT_RISK,
      score: Math.max(
        SCORE_RANGES.AT_RISK.MIN,
        Math.min(SCORE_RANGES.AT_RISK.MAX, rfmScore)
      ),
      reasons: [
        `Không có đơn hàng gần đây trong ${effectiveRecency} ngày`,
        `Lịch sử mua hàng trước đó: ${totalOrders} đơn hàng`,
        "Tương tác giảm",
      ],
    };
  }

  // 🟡 POTENTIAL: Recent activity with low purchase history
  // For users registered >= 14 days but with low engagement
  if (
    daysSinceRegistration >= TIME_THRESHOLDS.POTENTIAL_RECENCY &&
    daysSinceLastActivity <= TIME_THRESHOLDS.POTENTIAL_RECENCY &&
    (frequency <= CLASSIFICATION.MAX_FREQUENCY_POTENTIAL_LOW ||
      frequency === 0) &&
    (recentImportantEventCount > 0 ||
      engagementScore > BEHAVIOR_CONFIG.MIN_ENGAGEMENT_SCORE_POTENTIAL)
  ) {
    return {
      type: SEGMENTATION_TYPES.POTENTIAL,
      score: Math.max(
        SCORE_RANGES.POTENTIAL.MIN,
        Math.min(SCORE_RANGES.POTENTIAL.MAX, rfmScore)
      ), // Score 50-79
      reasons: [
        `Hoạt động gần đây (${daysSinceLastActivity} ngày trước)`,
        frequency === 0
          ? "Chưa có mua hàng"
          : `Tần suất mua hàng thấp: ${frequency}`,
        recentImportantEventCount > 0
          ? "Có dấu hiệu muốn mua hàng"
          : "Đang duyệt web tích cực",
      ],
    };
  }

  // 🟡 POTENTIAL: Some activity but low purchases
  // For users registered >= 14 days but haven't reached LOYAL criteria
  if (
    daysSinceRegistration >= TIME_THRESHOLDS.POTENTIAL_RECENCY &&
    daysSinceLastActivity <= TIME_THRESHOLDS.POTENTIAL_RECENCY &&
    frequency <= CLASSIFICATION.MAX_FREQUENCY_POTENTIAL_SOME &&
    monetary < RFM_THRESHOLDS.HIGH_MONETARY
  ) {
    return {
      type: SEGMENTATION_TYPES.POTENTIAL,
      score: Math.max(
        SCORE_RANGES.POTENTIAL.MIN,
        Math.min(SCORE_RANGES.POTENTIAL.MAX, rfmScore)
      ),
      reasons: [
        `Hoạt động gần đây (${daysSinceLastActivity} ngày trước)`,
        `Tần suất mua hàng thấp: ${frequency}`,
        `Chi tiêu thấp: ${Math.round(monetary / 1000)}K VND`,
      ],
    };
  }

  // Default: POTENTIAL for others (moderate activity, uncertain engagement)
  // This ensures new users or users without clear pattern are POTENTIAL
  return {
    type: SEGMENTATION_TYPES.POTENTIAL,
    score: Math.max(
      SCORE_RANGES.POTENTIAL.MIN,
      Math.min(SCORE_RANGES.POTENTIAL.MAX, rfmScore)
    ),
    reasons: [
      daysSinceRegistration < TIME_THRESHOLDS.POTENTIAL_RECENCY
        ? `Khách hàng mới (đăng ký ${daysSinceRegistration} ngày trước)`
        : `Hoạt động vừa phải (${daysSinceLastActivity} ngày trước)`,
      `Tần suất: ${frequency} giao dịch`,
      // "Chưa đủ dữ liệu để phân loại vào các segment khác",
    ],
  };
};

/**
 * Analyze and segment a single customer
 * @param {String} userId - User ID (will get customer by userId)
 * @param {Object} options - Analysis options
 * @returns {Object} Segmentation result
 */
const analyzeCustomer = async (userId, options = {}) => {
  const { forceUpdate = false, analysisDate = new Date() } = options;

  // Get customer from identity-service by userId
  const customer = await identityClient.getCustomerInfoByUserId(userId);
  if (!customer) {
    throw new NotFoundError("Customer not found");
  }

  // Get customerId from customer object
  const customerId = customer._id?.toString() || customer.id?.toString();

  // Check if segmentation exists and is recent (unless force update)
  if (!forceUpdate && customer.segmentation?.lastAnalyzed) {
    const lastAnalyzed = new Date(customer.segmentation.lastAnalyzed);
    const daysSinceAnalysis = Math.floor(
      (analysisDate - lastAnalyzed) / (1000 * 60 * 60 * 24)
    );

    // If analyzed within cache period, return cached result
    if (daysSinceAnalysis < CACHE_CONFIG.CACHE_DAYS) {
      return customer.segmentation;
    }
  }

  // Get orders by userId (userId is already available as parameter)
  let orders = [];
  if (userId) {
    try {
      console.log(`[Segmentation] Fetching orders for user ${userId}`);

      const orderData = await orderClient.getUserOrders(userId, {
        limit: BATCH_CONFIG.MAX_ORDERS_LIMIT,
      });
      orders = orderData.orders || [];

      console.log(
        `[Segmentation] Found ${orders.length} orders for user ${userId}`
      );
      if (orders.length > 0) {
        console.log(
          `[Segmentation] Order statuses:`,
          orders.map((o) => ({
            id: o._id,
            status: o.status,
            paymentStatus: o.payment?.status,
            createdAt: o.createdAt || o.created_at,
            total: o.pricing?.total || o.total,
          }))
        );
      }
    } catch (error) {
      console.error(
        `[Segmentation] Error fetching orders for user ${userId}:`,
        error.message,
        error.stack
      );
    }
  } else {
    console.log(`[Segmentation] User ${userId} has no orders (guest customer)`);
  }

  // Get behavior events from identity-service by userId
  let behaviorEvents = [];
  try {
    console.log(`[Segmentation] Fetching behavior events for user ${userId}`);
    const behaviorData = await identityClient.getUserBehavior(userId, {
      limit: BATCH_CONFIG.MAX_BEHAVIOR_EVENTS_LIMIT,
      page: 1,
    });
    console.log("[Segmentation] behaviorData okok", behaviorData);
    behaviorEvents = behaviorData.events || [];
    console.log(
      `[Segmentation] Found ${behaviorEvents.length} behavior events for user ${userId}`
    );
  } catch (error) {
    console.error(
      `[Segmentation] Error fetching behavior for user ${userId}:`,
      error.message,
      error.stack
    );
  }

  // Calculate RFM
  const rfm = calculateRFM(customer, orders, analysisDate);
  console.log(`[Segmentation] RFM for customer ${customerId}:`, {
    recency: rfm.recency,
    frequency: rfm.frequency,
    monetary: rfm.monetary,
    totalOrders: rfm.totalOrders,
    lastActivityDate: rfm.lastActivityDate,
  });

  // Calculate behavior score
  const behavior = calculateBehaviorScore(behaviorEvents, analysisDate);
  console.log(`[Segmentation] Behavior for customer ${customerId}:`, {
    recentEventCount: behavior.recentEventCount,
    engagementScore: behavior.engagementScore,
    daysSinceLastActivity: behavior.daysSinceLastActivity,
    recentImportantEventCount: behavior.recentImportantEventCount,
  });

  // Classify customer
  const classification = classifyCustomer(
    rfm,
    behavior,
    customer,
    analysisDate
  );
  console.log(`[Segmentation] Classification for customer ${customerId}:`, {
    type: classification.type,
    score: classification.score,
    reasons: classification.reasons,
  });

  // Calculate RFM score for result
  const rfmScore = calculateRFMScore(rfm);
  console.log(
    `[Segmentation] RFM Score for customer ${customerId}: ${rfmScore}`
  );

  // Build segmentation result
  const segmentation = {
    type: classification.type,
    score: classification.score,
    rfmScore: rfmScore, // Add RFM score (0-100) for advanced analysis
    reasons: classification.reasons,
    rfm: {
      recency:
        rfm.recency !== null ? rfm.recency : behavior.daysSinceLastActivity,
      frequency: rfm.frequency,
      monetary: rfm.monetary,
      lastActivityDate: rfm.lastActivityDate,
    },
    behavior: {
      recentEventCount: behavior.recentEventCount,
      engagementScore: behavior.engagementScore,
      daysSinceLastActivity: behavior.daysSinceLastActivity,
      recentImportantEventCount: behavior.recentImportantEventCount,
    },
    lastAnalyzed: analysisDate,
    metadata: {
      totalOrders: rfm.totalOrders, // Use completed orders count from RFM, not all orders
      totalBehaviorEvents: behaviorEvents.length,
      daysSinceRegistration: customer.firstSeenAt
        ? Math.floor(
            (analysisDate - new Date(customer.firstSeenAt)) /
              (1000 * 60 * 60 * 24)
          )
        : null,
    },
  };

  // Get old segmentation before update
  const oldSegmentation = customer.segmentation;

  // Update customer with segmentation via identity-service
  await identityClient.updateCustomerSegmentation(customerId, segmentation);

  // Trigger voucher if segmentation changed (async, don't wait)
  if (oldSegmentation?.type !== segmentation.type && userId) {
    voucherClient
      .onSegmentationChanged(
        userId.toString(),
        customerId.toString(),
        oldSegmentation,
        segmentation
      )
      .catch((err) => {
        console.error(
          "Error triggering voucher for segmentation change:",
          err.message
        );
      });
  }

  return segmentation;
};

/**
 * Analyze multiple customers (batch processing)
 * @param {Array} customerIds - Array of customer IDs
 * @param {Object} options - Analysis options
 * @returns {Array} Array of segmentation results
 */
const analyzeCustomers = async (customerIds, options = {}) => {
  const { batchSize = BATCH_CONFIG.DEFAULT_BATCH_SIZE } = options;
  const results = [];

  for (let i = 0; i < customerIds.length; i += batchSize) {
    const batch = customerIds.slice(i, i + batchSize);
    const batchResults = await Promise.allSettled(
      batch.map((customerId) => analyzeCustomer(customerId, options))
    );

    batchResults.forEach((result, index) => {
      if (result.status === "fulfilled") {
        results.push({
          customerId: batch[index],
          segmentation: result.value,
        });
      } else {
        console.error(
          `Error analyzing customer ${batch[index]}:`,
          result.reason
        );
        results.push({
          customerId: batch[index],
          error: result.reason.message,
        });
      }
    });
  }

  return results;
};

/**
 * Analyze all customers (no limit, sorted by updatedAt)
 * @param {Object} options - Options for analysis
 * @param {Boolean} options.forceUpdate - Force re-analysis even if recently analyzed (default: true)
 * @param {Number} options.batchSize - Batch size for processing (default: 10)
 * @returns {Object} Analysis results with progress info
 */
const analyzeAllCustomers = async (options = {}) => {
  const { forceUpdate = true, batchSize = BATCH_CONFIG.DEFAULT_BATCH_SIZE } =
    options;
  console.log("vao day2");

  try {
    const customerData = await identityClient.getAllCustomerIdsWithMetadata();

    // Extract IDs (already sorted by updatedAt from database)
    const customerIds = customerData.map((c) =>
      typeof c === "string" ? c : c.id
    );

    if (customerIds.length === 0) {
      return {
        total: 0,
        processed: 0,
        success: 0,
        failed: 0,
        results: [],
      };
    }

    // Analyze all customers in batches
    console.log(
      `[Segmentation] Starting batch analysis (batchSize: ${batchSize}, forceUpdate: ${forceUpdate})...`
    );
    const startTime = Date.now();

    const results = await analyzeCustomers(customerIds, {
      forceUpdate: forceUpdate,
      batchSize: batchSize,
    });

    const duration = Date.now() - startTime;
    const successCount = results.filter((r) => !r.error).length;
    const failedCount = results.filter((r) => r.error).length;

    console.log(
      `[Segmentation] Completed analysis: ${successCount} success, ${failedCount} failed in ${duration}ms`
    );

    return {
      total: customerIds.length,
      processed: results.length,
      success: successCount,
      failed: failedCount,
      duration: duration,
      results: results,
    };
  } catch (error) {
    console.error("Error analyzing all customers:", error.message);
    throw error;
  }
};

/**
 * Get segmentation statistics
 * Optionally re-analyzes all customers before returning stats
 * @param {Object} options - Options for re-analysis
 * @param {Boolean} options.forceReAnalyze - Force re-analysis even if recently analyzed (default: false)
 * @param {Number} options.batchSize - Batch size for processing (default: 10)
 * @returns {Object} Statistics by segmentation type
 */
const getSegmentationStats = async (options = {}) => {
  const {
    forceReAnalyze = false,
    batchSize = BATCH_CONFIG.DEFAULT_BATCH_SIZE,
  } = options;

  try {
    // Only re-analyze if explicitly requested
    if (forceReAnalyze) {
      try {
        // Get all customer IDs (sorted by updatedAt)
        console.log(
          "[Segmentation] Fetching all customer IDs for re-analysis..."
        );
        const customerIds = await identityClient.getAllCustomerIds();
        console.log(
          `[Segmentation] Found ${customerIds.length} customers to analyze`
        );

        if (customerIds.length > 0) {
          // Re-analyze all customers (already sorted by updatedAt)
          console.log(
            `[Segmentation] Starting batch re-analysis (batchSize: ${batchSize}, forceUpdate: ${forceReAnalyze})...`
          );
          const startTime = Date.now();

          await analyzeCustomers(customerIds, {
            forceUpdate: forceReAnalyze,
            batchSize: batchSize,
          });

          const duration = Date.now() - startTime;
          console.log(
            `[Segmentation] Completed re-analysis of ${customerIds.length} customers in ${duration}ms`
          );
        }
      } catch (reAnalyzeError) {
        console.error(
          "[Segmentation] Error during re-analysis, continuing with existing stats:",
          reAnalyzeError.message
        );
        // Continue to get stats even if re-analysis fails
      }
    }

    // Get statistics from database
    const stats = await identityClient.getSegmentationStats();
    return stats;
  } catch (error) {
    console.error(
      "Error fetching segmentation stats:",
      error.message,
      error.stack
    );
    // Return empty stats on error
    return {
      [SEGMENTATION_TYPES.POTENTIAL]: { count: 0, avgScore: 0 },
      [SEGMENTATION_TYPES.LOYAL]: { count: 0, avgScore: 0 },
      [SEGMENTATION_TYPES.AT_RISK]: { count: 0, avgScore: 0 },
      [SEGMENTATION_TYPES.CHURNED]: { count: 0, avgScore: 0 },
      unclassified: { count: 0, avgScore: 0 },
    };
  }
};

module.exports = {
  analyzeCustomer,
  analyzeCustomers,
  analyzeAllCustomers,
  getSegmentationStats,
  // Export constants for backward compatibility
  SEGMENTATION_TYPES,
  TIME_THRESHOLDS,
  RFM_THRESHOLDS,
};
