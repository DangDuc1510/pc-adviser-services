const customerService = require("../services/customer.service");
const customerRepository = require("../repositories/customer.repository");
const axios = require("axios");

// Get all customers
const getAllCustomers = async (req, res, next) => {
  try {
    const result = await customerService.getAllCustomers(req.query, req.user);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

// Get customer by ID
const getCustomerById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const customer = await customerService.getCustomerById(id, req.user);
    res.json(customer);
  } catch (error) {
    next(error);
  }
};

// Update customer
const updateCustomer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await customerService.updateCustomer(id, req.body, req.user);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

// Get customer statistics
const getCustomerStats = async (req, res, next) => {
  try {
    const stats = await customerService.getCustomerStats(req.user);
    res.json(stats);
  } catch (error) {
    next(error);
  }
};

// Get customer behavior (calls behavior service)
const getCustomerBehavior = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 50, eventType, entityType } = req.query;

    // This will be handled by behavior controller
    // For now, just return a placeholder
    res.json({
      message: "Behavior data will be returned by behavior service",
      customerId: id,
    });
  } catch (error) {
    next(error);
  }
};

// Get customer orders (calls order service)
const getCustomerOrders = async (req, res, next) => {
  try {
    const { id } = req.params;
    const customer = await customerService.getCustomerById(id, req.user);

    const orderServiceUrl =
      process.env.ORDER_SERVICE_URL || "http://localhost:3003";

    try {
      // Get orders by userId
      // Handle case where userId might be populated (object) or ObjectId (string)
      let userIdValue = null;
      if (customer.userId) {
        if (typeof customer.userId === "object" && customer.userId._id) {
          // userId is populated object, extract _id
          userIdValue = customer.userId._id.toString();
        } else {
          // userId is already an ObjectId or string
          userIdValue = customer.userId.toString();
        }
      }
      const queryParams = userIdValue ? `?userId=${userIdValue}` : "";

      const response = await axios.get(
        `${orderServiceUrl}/orders${queryParams}`,
        {
          headers: {
            Authorization: req.headers.authorization,
            "x-access-token": req.headers["x-access-token"],
          },
        }
      );

      res.json(response.data);
    } catch (error) {
      if (error.response) {
        res.status(error.response.status).json(error.response.data);
      } else {
        throw new Error("Không thể kết nối đến Order Service");
      }
    }
  } catch (error) {
    next(error);
  }
};

// Internal endpoint - Update customer stats (service-to-service only)
const updateCustomerStatsInternal = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { totalOrders, totalSpent } = req.body;

    if (!userId) {
      return res.status(400).json({
        status: "fail",
        message: "User ID is required",
      });
    }

    // Find customer by userId
    const customer = await customerService.getCustomerByUserId(userId);

    if (!customer) {
      return res.status(404).json({
        status: "fail",
        message: "Customer not found",
      });
    }

    // Update stats using $inc to increment values
    const stats = {};
    if (totalOrders !== undefined) {
      stats.totalOrders = totalOrders;
    }
    if (totalSpent !== undefined) {
      stats.totalSpent = totalSpent;
    }

    const updatedCustomer = await customerRepository.updateStats(
      customer._id,
      stats,
      true // useIncrement = true to use $inc
    );

    res.json({
      status: "success",
      data: updatedCustomer,
    });
  } catch (error) {
    next(error);
  }
};

// Internal endpoint - Get customer by ID (service-to-service only)
const getCustomerByIdInternal = async (req, res, next) => {
  try {
    const { id } = req.params;
    const customer = await customerRepository.findById(id);

    if (!customer) {
      return res.status(404).json({
        status: "fail",
        message: "Customer not found",
      });
    }

    res.json({
      status: "success",
      data: customer,
    });
  } catch (error) {
    next(error);
  }
};

// Internal endpoint - Get customer info by userId (service-to-service only)
const getCustomerInfoByUserIdInternal = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const customer = await customerService.getCustomerByUserId(userId);

    if (!customer) {
      return res.status(404).json({
        status: "fail",
        message: "Customer not found",
      });
    }

    res.json({
      status: "success",
      data: customer,
    });
  } catch (error) {
    next(error);
  }
};

// Internal endpoint - Update customer segmentation (service-to-service only)
const updateCustomerSegmentationInternal = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { segmentation } = req.body;

    if (!segmentation) {
      return res.status(400).json({
        status: "fail",
        message: "Segmentation data is required",
      });
    }

    const updatedCustomer = await customerRepository.updateById(
      id,
      { segmentation },
      { new: true }
    );

    if (!updatedCustomer) {
      return res.status(404).json({
        status: "fail",
        message: "Customer not found",
      });
    }

    res.json({
      status: "success",
      data: updatedCustomer,
    });
  } catch (error) {
    next(error);
  }
};

// Internal endpoint - Get all customer IDs (service-to-service only)
// Returns customers sorted by updatedAt (oldest first) for batch processing
const getAllCustomerIdsInternal = async (req, res, next) => {
  console.log("vao day4");
  try {
    const customerData = await customerRepository.getAllIdsWithMetadata();

    console.log(
      `[getAllCustomerIdsInternal] Returning ${customerData.length} customers`
    );

    res.json({
      status: "success",
      data: customerData,
    });
  } catch (error) {
    console.error(
      "[getAllCustomerIdsInternal] Error:",
      error.message,
      error.stack
    );
    next(error);
  }
};

// Internal endpoint - Get segmentation statistics (service-to-service only)
const getSegmentationStatsInternal = async (req, res, next) => {
  try {
    const Customer = require("../models/customer.model");

    const stats = await Customer.aggregate([
      {
        $group: {
          _id: {
            $ifNull: ["$segmentation.type", "unclassified"],
          },
          count: { $sum: 1 },
          avgScore: { $avg: "$segmentation.score" },
        },
      },
    ]);

    const result = {
      potential: { count: 0, avgScore: 0 },
      loyal: { count: 0, avgScore: 0 },
      at_risk: { count: 0, avgScore: 0 },
      churned: { count: 0, avgScore: 0 },
      unclassified: { count: 0, avgScore: 0 },
    };
    console.log("stats", stats);
    stats.forEach((stat) => {
      const type = stat._id || "unclassified";
      if (result[type]) {
        result[type].count = stat.count;
        result[type].avgScore = Math.round((stat.avgScore || 0) * 100) / 100;
      } else {
        // If unknown type, add to unclassified
        result.unclassified.count += stat.count;
      }
    });

    res.json({
      status: "success",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// Internal endpoint - Get customers by userIds batch (service-to-service only)
const getCustomersByUserIdsBatch = async (req, res, next) => {
  try {
    const { userIds } = req.body;

    if (!Array.isArray(userIds)) {
      return res.status(400).json({
        status: "fail",
        message: "userIds must be an array",
      });
    }

    const customers = await customerService.getCustomersByUserIdsBatch(userIds);

    res.json({
      status: "success",
      data: customers,
    });
  } catch (error) {
    next(error);
  }
};

// Internal endpoint - Get users by segmentation type (service-to-service only)
const getUsersBySegmentationTypeInternal = async (req, res, next) => {
  try {
    const { type } = req.params;
    const { page = 1, limit = 1000 } = req.query;

    const result = await customerService.getUsersBySegmentationType(type, {
      page: parseInt(page),
      limit: parseInt(limit),
    });

    res.json({
      status: "success",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllCustomers,
  getCustomerById,
  updateCustomer,
  getCustomerStats,
  getCustomerBehavior,
  getCustomerOrders,
  updateCustomerStatsInternal,
  getCustomerByIdInternal,
  getCustomerInfoByUserIdInternal,
  getAllCustomerIdsInternal,
  updateCustomerSegmentationInternal,
  getSegmentationStatsInternal,
  getCustomersByUserIdsBatch,
  getUsersBySegmentationTypeInternal,
};
