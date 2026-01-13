const behaviorRepository = require("../repositories/behavior.repository");
const customerRepository = require("../repositories/customer.repository");
const {
  ValidationError,
  NotFoundError,
  AuthorizationError,
} = require("../errors");

// Track a behavior event
const trackEvent = async (eventData) => {
  const {
    customerId,
    userId,
    eventType,
    entityType,
    entityId,
    metadata,
    sessionId,
  } = eventData;

  // Validate required fields
  if (!eventType || !entityType) {
    throw new ValidationError("eventType và entityType là bắt buộc");
  }

  // If customerId not provided and userId is provided, find customer by userId
  let finalCustomerId = customerId;
  if (!finalCustomerId && userId) {
    const customer = await customerRepository.findByUserId(userId);
    if (customer) {
      finalCustomerId = customer._id;
    }
  }

  if (!finalCustomerId) {
    throw new ValidationError("customerId hoặc userId là bắt buộc");
  }

  const event = {
    customerId: finalCustomerId,
    userId: userId || null,
    eventType,
    entityType,
    entityId: entityId || null,
    metadata: metadata || {},
    timestamp: new Date(),
    sessionId: sessionId || null,
  };

  return await behaviorRepository.create(event);
};

// Track multiple events (batch)
const trackEvents = async (events) => {
  if (!Array.isArray(events) || events.length === 0) {
    throw new ValidationError("events phải là một mảng không rỗng");
  }

  // Process each event to ensure customerId exists
  const processedEvents = await Promise.all(
    events.map(async (eventData) => {
      let finalCustomerId = eventData.customerId;

      if (!finalCustomerId && eventData.userId) {
        const customer = await customerRepository.findByUserId(
          eventData.userId
        );
        if (customer) {
          finalCustomerId = customer._id;
        }
      }

      if (!finalCustomerId) {
        throw new ValidationError(
          "customerId hoặc userId là bắt buộc cho mỗi event"
        );
      }

      return {
        customerId: finalCustomerId,
        userId: eventData.userId || null,
        eventType: eventData.eventType,
        entityType: eventData.entityType,
        entityId: eventData.entityId || null,
        metadata: eventData.metadata || {},
        timestamp: eventData.timestamp || new Date(),
        sessionId: eventData.sessionId || null,
      };
    })
  );

  return await behaviorRepository.insertMany(processedEvents);
};

// Get behavior events for user (by userId)
const getUserBehavior = async (userId, options = {}) => {
  return await behaviorRepository.findByUserId(userId, options);
};

// Get behavior events for user by finding customer with userId (internal endpoint)
// This finds customer with userId pattern "user/${userId}" and returns their behavior
const getUserBehaviorByCustomer = async (userId, options = {}) => {
  const mongoose = require("mongoose");

  // Convert userId to ObjectId if it's a string
  let userObjectId;
  try {
    userObjectId = mongoose.Types.ObjectId.isValid(userId)
      ? new mongoose.Types.ObjectId(userId)
      : userId;
  } catch (error) {
    // If userId is not a valid ObjectId, try to find by string
    userObjectId = userId;
  }

  // Find customer with this userId
  const customer = await customerRepository.findByUserId(userObjectId);

  if (!customer) {
    // Return empty result if customer not found
    return {
      events: [],
      pagination: {
        current: options.page || 1,
        pageSize: options.limit || 50,
        total: 0,
        pages: 0,
      },
    };
  }

  // Return behavior for the found customer
  return await behaviorRepository.findByCustomerId(customer._id, options);
};

// Get behavior events for customer
const getCustomerBehavior = async (customerId, options = {}) => {
  const customer = await customerRepository.findById(customerId);
  if (!customer) {
    throw new NotFoundError("Khách hàng không tồn tại");
  }

  return await behaviorRepository.findByCustomerId(customerId, options);
};

// Get behavior summary
const getBehaviorSummary = async (customerId, requestingUser) => {
  if (!requestingUser || !requestingUser.id) {
    throw new AuthorizationError("Người dùng không được xác thực");
  }

  if (!["admin", "manager", "sales"].includes(requestingUser.role)) {
    throw new AuthorizationError("Không có quyền xem thống kê hành vi");
  }

  const customer = await customerRepository.findById(customerId);
  if (!customer) {
    throw new NotFoundError("Khách hàng không tồn tại");
  }

  return await behaviorRepository.getBehaviorSummary(customerId);
};

// Get behavior timeline
const getBehaviorTimeline = async (
  customerId,
  options = {},
  requestingUser
) => {
  if (!requestingUser || !requestingUser.id) {
    throw new AuthorizationError("Người dùng không được xác thực");
  }

  if (!["admin", "manager", "sales"].includes(requestingUser.role)) {
    throw new AuthorizationError("Không có quyền xem timeline hành vi");
  }

  const customer = await customerRepository.findById(customerId);
  if (!customer) {
    throw new NotFoundError("Khách hàng không tồn tại");
  }

  return await behaviorRepository.getTimeline(customerId, options);
};

// Get behavior summary by userId (internal endpoint)
const getUserBehaviorSummary = async (userId) => {
  const mongoose = require("mongoose");

  let userObjectId;
  try {
    userObjectId = mongoose.Types.ObjectId.isValid(userId)
      ? new mongoose.Types.ObjectId(userId)
      : userId;
  } catch (error) {
    userObjectId = userId;
  }

  const customer = await customerRepository.findByUserId(userObjectId);

  if (!customer) {
    return {
      eventTypeSummary: [],
      entityTypeSummary: [],
      topProducts: [],
    };
  }

  return await behaviorRepository.getBehaviorSummary(customer._id);
};

// Get behavior timeline by userId (internal endpoint)
const getUserBehaviorTimeline = async (userId, options = {}) => {
  const mongoose = require("mongoose");

  let userObjectId;
  try {
    userObjectId = mongoose.Types.ObjectId.isValid(userId)
      ? new mongoose.Types.ObjectId(userId)
      : userId;
  } catch (error) {
    userObjectId = userId;
  }

  const customer = await customerRepository.findByUserId(userObjectId);

  if (!customer) {
    return [];
  }

  return await behaviorRepository.getTimeline(customer._id, options);
};

// Get product analytics
const getProductAnalytics = async (productId, options = {}, requestingUser) => {
  if (!requestingUser || !requestingUser.id) {
    throw new AuthorizationError("Người dùng không được xác thực");
  }

  if (!["admin", "manager", "sales"].includes(requestingUser.role)) {
    throw new AuthorizationError("Không có quyền xem analytics sản phẩm");
  }

  return await behaviorRepository.getProductAnalytics(productId, options);
};

// Get overview analytics
const getOverviewAnalytics = async (options = {}, requestingUser) => {
  if (!requestingUser || !requestingUser.id) {
    throw new AuthorizationError("Người dùng không được xác thực");
  }

  if (!["admin", "manager", "sales"].includes(requestingUser.role)) {
    throw new AuthorizationError("Không có quyền xem tổng quan analytics");
  }

  return await behaviorRepository.getOverviewAnalytics(options);
};

module.exports = {
  trackEvent,
  trackEvents,
  getUserBehavior,
  getUserBehaviorByCustomer,
  getCustomerBehavior,
  getBehaviorSummary,
  getBehaviorTimeline,
  getUserBehaviorSummary,
  getUserBehaviorTimeline,
  getProductAnalytics,
  getOverviewAnalytics,
};
