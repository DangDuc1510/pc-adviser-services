const behaviorService = require("../services/behavior.service");

// Track a single event (public, no auth required)
const trackEvent = async (req, res, next) => {
  try {
    const {
      customerId,
      userId,
      eventType,
      entityType,
      entityId,
      metadata,
      sessionId,
    } = req.body;

    // Get IP and User-Agent from request if not provided
    const clientIp =
      req.ip || req.headers["x-forwarded-for"] || req.connection.remoteAddress;
    const clientUserAgent = req.headers["user-agent"];

    const eventMetadata = {
      ...metadata,
      ipAddress: metadata?.ipAddress || clientIp,
      userAgent: metadata?.userAgent || clientUserAgent,
      url: metadata?.url || req.headers.referer,
    };

    // If user is authenticated, use their userId
    const finalUserId = userId || req.user?.id || null;

    const event = await behaviorService.trackEvent({
      customerId,
      userId: finalUserId,
      eventType,
      entityType,
      entityId,
      metadata: eventMetadata,
      sessionId: sessionId || req.headers["x-session-id"],
    });

    res.status(201).json({
      status: "success",
      message: "Event tracked successfully",
      data: event,
    });
  } catch (error) {
    next(error);
  }
};

// Track multiple events (batch)
const trackEvents = async (req, res, next) => {
  try {
    const { events } = req.body;

    if (!Array.isArray(events) || events.length === 0) {
      return res.status(400).json({
        status: "error",
        message: "events phải là một mảng không rỗng",
      });
    }

    // Get IP and User-Agent from request
    const clientIp =
      req.ip || req.headers["x-forwarded-for"] || req.connection.remoteAddress;
    const clientUserAgent = req.headers["user-agent"];

    // Process events
    const processedEvents = events.map((eventData) => ({
      ...eventData,
      userId: eventData.userId || req.user?.id || null,
      metadata: {
        ...eventData.metadata,
        ipAddress: eventData.metadata?.ipAddress || clientIp,
        userAgent: eventData.metadata?.userAgent || clientUserAgent,
      },
      sessionId: eventData.sessionId || req.headers["x-session-id"],
    }));

    const result = await behaviorService.trackEvents(processedEvents);

    res.status(201).json({
      status: "success",
      message: `${result.length} events tracked successfully`,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// Get behavior events for user (by userId)
const getUserBehavior = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { page, limit, eventType, entityType } = req.query;

    // Users can only view their own behavior data
    if (
      req.user?.id !== userId &&
      !["admin", "employee"].includes(req.user?.role)
    ) {
      return res.status(403).json({
        status: "error",
        message: "Bạn không có quyền xem dữ liệu hành vi của người dùng khác",
      });
    }

    const result = await behaviorService.getUserBehavior(userId, {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 50,
      eventType,
      entityType,
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
};

// Get behavior events for customer
const getCustomerBehavior = async (req, res, next) => {
  try {
    console.log("[BehaviorController] getCustomerBehavior", req.params);
    const { customerId } = req.params;
    const { page, limit, eventType, entityType } = req.query;

    const result = await behaviorService.getCustomerBehavior(customerId, {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 50,
      eventType,
      entityType,
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
};

// Get behavior events for customer (internal endpoint, no auth required)
const getCustomerBehaviorInternal = async (req, res, next) => {
  try {
    const { customerId } = req.params;
    const { page, limit, eventType, entityType } = req.query;

    const result = await behaviorService.getCustomerBehavior(customerId, {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 1000,
      eventType,
      entityType,
    });

    res.json({
      status: "success",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// Get behavior events for user by finding customer with userId (internal endpoint, no auth required)
const getUserBehaviorInternal = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { page, limit, eventType, entityType } = req.query;

    const result = await behaviorService.getUserBehaviorByCustomer(userId, {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 1000,
      eventType,
      entityType,
    });
    console.log("okkkkkkkkresult", result);
    res.json({
      status: "success",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// Get behavior summary
const getBehaviorSummary = async (req, res, next) => {
  try {
    const { customerId } = req.params;
    const summary = await behaviorService.getBehaviorSummary(
      customerId,
      req.user
    );
    res.json(summary);
  } catch (error) {
    next(error);
  }
};

// Get behavior timeline
const getBehaviorTimeline = async (req, res, next) => {
  try {
    const { customerId } = req.params;
    const { startDate, endDate, eventType, entityType, limit } = req.query;

    const timeline = await behaviorService.getBehaviorTimeline(
      customerId,
      { startDate, endDate, eventType, entityType, limit },
      req.user
    );

    res.json(timeline);
  } catch (error) {
    next(error);
  }
};

// Get behavior summary by userId (internal endpoint, no auth required)
const getUserBehaviorSummaryInternal = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const summary = await behaviorService.getUserBehaviorSummary(userId);

    res.json({
      status: "success",
      data: summary,
    });
  } catch (error) {
    next(error);
  }
};

// Get behavior timeline by userId (internal endpoint, no auth required)
const getUserBehaviorTimelineInternal = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { startDate, endDate, eventType, entityType, limit } = req.query;

    const timeline = await behaviorService.getUserBehaviorTimeline(userId, {
      startDate,
      endDate,
      eventType,
      entityType,
      limit,
    });

    res.json({
      status: "success",
      data: timeline,
    });
  } catch (error) {
    next(error);
  }
};

// Get product analytics
const getProductAnalytics = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { startDate, endDate } = req.query;

    const analytics = await behaviorService.getProductAnalytics(
      productId,
      { startDate, endDate },
      req.user
    );

    res.json(analytics);
  } catch (error) {
    next(error);
  }
};

// Get overview analytics
const getOverviewAnalytics = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    const analytics = await behaviorService.getOverviewAnalytics(
      { startDate, endDate },
      req.user
    );

    res.json(analytics);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  trackEvent,
  trackEvents,
  getUserBehavior,
  getCustomerBehavior,
  getCustomerBehaviorInternal,
  getUserBehaviorInternal,
  getBehaviorSummary,
  getBehaviorTimeline,
  getUserBehaviorSummaryInternal,
  getUserBehaviorTimelineInternal,
  getProductAnalytics,
  getOverviewAnalytics,
};
