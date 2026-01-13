const createBaseRepository = require('./base.repository');
const BehaviorEvent = require('../models/behaviorEvent.model');
const { DatabaseError } = require('../errors');

const baseRepo = createBaseRepository(BehaviorEvent);

// Batch insert events for performance
const insertMany = async (events) => {
  try {
    return await BehaviorEvent.insertMany(events, { ordered: false });
  } catch (error) {
    throw new DatabaseError(`Error inserting behavior events: ${error.message}`);
  }
};

// Get events by customerId with pagination
const findByCustomerId = async (customerId, options = {}) => {
  try {
    const mongoose = require('mongoose');
    const { page = 1, limit = 50, sort = { timestamp: -1 } } = options;
    const skip = (page - 1) * limit;
    const customerObjectId = new mongoose.Types.ObjectId(customerId);

    const [events, total] = await Promise.all([
      baseRepo.find({ customerId: customerObjectId }, { sort, skip, limit }),
      baseRepo.count({ customerId: customerObjectId })
    ]);

    return {
      events,
      pagination: {
        current: page,
        pageSize: limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    throw new DatabaseError(`Error finding events by customerId: ${error.message}`);
  }
};

// Get events by userId
const findByUserId = async (userId, options = {}) => {
  try {
    const mongoose = require('mongoose');
    const { page = 1, limit = 50, sort = { timestamp: -1 } } = options;
    const skip = (page - 1) * limit;
    const userObjectId = new mongoose.Types.ObjectId(userId);

    const [events, total] = await Promise.all([
      baseRepo.find({ userId: userObjectId }, { sort, skip, limit }),
      baseRepo.count({ userId: userObjectId })
    ]);

    return {
      events,
      pagination: {
        current: page,
        pageSize: limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    throw new DatabaseError(`Error finding events by userId: ${error.message}`);
  }
};


// Get behavior summary for customer
const getBehaviorSummary = async (customerId) => {
  try {
    const mongoose = require('mongoose');
    const objectId = new mongoose.Types.ObjectId(customerId);
    
    const summary = await BehaviorEvent.aggregate([
      { $match: { customerId: objectId } },
      {
        $group: {
          _id: '$eventType',
          count: { $sum: 1 },
          lastOccurrence: { $max: '$timestamp' }
        }
      }
    ]);

    // Also get entity type summary
    const entitySummary = await BehaviorEvent.aggregate([
      { $match: { customerId: objectId } },
      {
        $group: {
          _id: { eventType: '$eventType', entityType: '$entityType' },
          count: { $sum: 1 }
        }
      }
    ]);

    // Get most viewed products
    const topProducts = await BehaviorEvent.aggregate([
      {
        $match: {
          customerId: objectId,
          entityType: 'product',
          eventType: 'view'
        }
      },
      {
        $group: {
          _id: '$entityId',
          viewCount: { $sum: 1 },
          lastViewed: { $max: '$timestamp' }
        }
      },
      { $sort: { viewCount: -1 } },
      { $limit: 10 }
    ]);

    return {
      eventTypeSummary: summary,
      entityTypeSummary: entitySummary,
      topProducts
    };
  } catch (error) {
    throw new DatabaseError(`Error getting behavior summary: ${error.message}`);
  }
};

// Get timeline of events
const getTimeline = async (customerId, options = {}) => {
  try {
    const mongoose = require('mongoose');
    const { startDate, endDate, eventType, entityType, limit = 100 } = options;
    
    const match = { customerId: new mongoose.Types.ObjectId(customerId) };
    
    if (startDate) {
      match.timestamp = match.timestamp || {};
      match.timestamp.$gte = new Date(startDate);
    }
    if (endDate) {
      match.timestamp = match.timestamp || {};
      match.timestamp.$lte = new Date(endDate);
    }
    if (eventType) match.eventType = eventType;
    if (entityType) match.entityType = entityType;

    return await baseRepo.find(match, {
      sort: { timestamp: -1 },
      limit: parseInt(limit)
    });
  } catch (error) {
    throw new DatabaseError(`Error getting timeline: ${error.message}`);
  }
};

// Get analytics for a product
const getProductAnalytics = async (productId, options = {}) => {
  try {
    const { startDate, endDate } = options;
    
    const match = {
      entityType: 'product',
      entityId: productId
    };
    
    if (startDate) {
      match.timestamp = match.timestamp || {};
      match.timestamp.$gte = new Date(startDate);
    }
    if (endDate) {
      match.timestamp = match.timestamp || {};
      match.timestamp.$lte = new Date(endDate);
    }

    const analytics = await BehaviorEvent.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$eventType',
          count: { $sum: 1 },
          uniqueCustomers: { $addToSet: '$customerId' },
          uniqueUsers: { $addToSet: '$userId' }
        }
      }
    ]);

    // Calculate unique counts
    const result = analytics.map(item => ({
      eventType: item._id,
      count: item.count,
      uniqueCustomers: item.uniqueCustomers.filter(Boolean).length,
      uniqueUsers: item.uniqueUsers.filter(Boolean).length
    }));

    return result;
  } catch (error) {
    throw new DatabaseError(`Error getting product analytics: ${error.message}`);
  }
};

// Get overview analytics
const getOverviewAnalytics = async (options = {}) => {
  try {
    const { startDate, endDate } = options;
    
    const match = {};
    if (startDate) {
      match.timestamp = match.timestamp || {};
      match.timestamp.$gte = new Date(startDate);
    }
    if (endDate) {
      match.timestamp = match.timestamp || {};
      match.timestamp.$lte = new Date(endDate);
    }

    const overview = await BehaviorEvent.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$eventType',
          count: { $sum: 1 },
          uniqueCustomers: { $addToSet: '$customerId' },
          uniqueUsers: { $addToSet: '$userId' }
        }
      }
    ]);

    const [totalEvents, uniqueCustomers, uniqueUsers] = await Promise.all([
      baseRepo.count(match),
      BehaviorEvent.distinct('customerId', match),
      BehaviorEvent.distinct('userId', match)
    ]);

    return {
      totalEvents,
      uniqueCustomers: uniqueCustomers.filter(Boolean).length,
      uniqueUsers: uniqueUsers.filter(Boolean).length,
      byEventType: overview.map(item => ({
        eventType: item._id,
        count: item.count,
        uniqueCustomers: item.uniqueCustomers.filter(Boolean).length,
        uniqueUsers: item.uniqueUsers.filter(Boolean).length
      }))
    };
  } catch (error) {
    throw new DatabaseError(`Error getting overview analytics: ${error.message}`);
  }
};

// Update many events (for merging guest to registered)
const updateMany = async (filter, update) => {
  try {
    return await BehaviorEvent.updateMany(filter, update);
  } catch (error) {
    throw new DatabaseError(`Error updating behavior events: ${error.message}`);
  }
};

module.exports = {
  ...baseRepo,
  insertMany,
  findByCustomerId,
  findByUserId,
  getBehaviorSummary,
  getTimeline,
  getProductAnalytics,
  getOverviewAnalytics,
  updateMany
};

