const customerRepository = require("../repositories/customer.repository");
const {
  ValidationError,
  NotFoundError,
  AuthorizationError,
} = require("../errors");
const { USER_ROLES } = require("../constants");
const User = require("../models/user.model");

// Get all customers with pagination and filters
const getAllCustomers = async (queryParams, requestingUser) => {
  if (!requestingUser || !requestingUser.id) {
    throw new AuthorizationError("Người dùng không được xác thực");
  }

  // Only admin and employee can view customers
  if (!["admin", "employee"].includes(requestingUser.role)) {
    throw new AuthorizationError("Không có quyền xem danh sách khách hàng");
  }

  const page = parseInt(queryParams.page) || 1;
  const limit = parseInt(queryParams.limit) || 10;
  const search = queryParams.search;
  const customerType = queryParams.customerType; // 'registered' or 'guest'

  let filter = {};

  // Exclude customers linked to non-customer users (admin, employee)
  // Only show customers with role='customer' or guest customers (no userId)
  const nonCustomerUsers = await User.find({
    role: { $ne: USER_ROLES.CUSTOMER },
  }).select("_id");

  const nonCustomerUserIds = nonCustomerUsers.map((u) => u._id);

  // Build filter based on customerType
  if (customerType && ["registered", "guest"].includes(customerType)) {
    // Filter by customerType in database
    filter.customerType = customerType;

    if (customerType === "guest") {
      // Guest customers: customerType='guest' AND no userId
      filter.userId = null;
    } else {
      // Registered customers: customerType='registered' AND has userId with role='customer'
      filter.userId = { $exists: true, $ne: null };
      if (nonCustomerUserIds.length > 0) {
        filter.userId.$nin = nonCustomerUserIds;
      }
    }
  } else {
    // No customerType filter: show both guest and registered (but only registered with role='customer')
    if (nonCustomerUserIds.length > 0) {
      filter.$or = [
        { customerType: "guest", userId: null }, // Guest customers
        {
          customerType: "registered",
          userId: { $nin: nonCustomerUserIds },
        }, // Registered customers with role='customer'
      ];
    } else {
      // If no non-customer users, just filter by customerType
      filter.$or = [
        { customerType: "guest", userId: null },
        { customerType: "registered", userId: { $exists: true, $ne: null } },
      ];
    }
  }

  // Search
  if (search) {
    const searchResults = await customerRepository.searchCustomers(search, {
      populate: { path: "userId", select: "email userName role" },
    });

    // Filter search results to exclude non-customer users
    const filteredSearchResults = searchResults.filter((customer) => {
      // Guest customers are always included
      if (!customer.userId) return true;
      // Check if user role is customer
      return customer.userId.role === USER_ROLES.CUSTOMER;
    });

    const customerIds = filteredSearchResults.map((c) => c._id);
    if (customerIds.length > 0) {
      // Merge with existing filter using $and
      if (Object.keys(filter).length > 0) {
        filter = {
          $and: [filter, { _id: { $in: customerIds } }],
        };
      } else {
        filter._id = { $in: customerIds };
      }
    } else {
      // No results found
      return {
        customers: [],
        pagination: {
          current: page,
          pageSize: limit,
          total: 0,
          pages: 0,
        },
      };
    }
  }

  return await customerRepository.findWithPagination(filter, page, limit, {
    populate: { path: "userId", select: "email userName phone" },
    sort: { lastSeenAt: -1 },
  });
};

// Get customer by ID
const getCustomerById = async (customerId, requestingUser) => {
  if (!requestingUser || !requestingUser.id) {
    throw new AuthorizationError("Người dùng không được xác thực");
  }

  if (!["admin", "employee"].includes(requestingUser.role)) {
    throw new AuthorizationError("Không có quyền xem thông tin khách hàng");
  }

  const customer = await customerRepository.findById(customerId, {
    populate: { path: "userId", select: "email userName phone avatar" },
  });

  if (!customer) {
    throw new NotFoundError("Khách hàng không tồn tại");
  }

  return customer;
};

// Update customer
const updateCustomer = async (customerId, updateData, requestingUser) => {
  if (!requestingUser || !requestingUser.id) {
    throw new AuthorizationError("Người dùng không được xác thực");
  }

  if (!["admin", "employee"].includes(requestingUser.role)) {
    throw new AuthorizationError(
      "Không có quyền cập nhật thông tin khách hàng"
    );
  }

  // Only allow updating certain fields
  const allowedFields = ["metadata", "ipAddress", "userAgent"];
  const updateFields = {};

  allowedFields.forEach((field) => {
    if (updateData[field] !== undefined) {
      updateFields[field] = updateData[field];
    }
  });

  const customer = await customerRepository.updateById(
    customerId,
    updateFields,
    {
      new: true,
      populate: { path: "userId", select: "email userName phone" },
    }
  );

  if (!customer) {
    throw new NotFoundError("Khách hàng không tồn tại");
  }

  return {
    message: "Cập nhật thông tin khách hàng thành công",
    customer,
  };
};

// Get customer statistics
const getCustomerStats = async (requestingUser) => {
  if (!requestingUser || !requestingUser.id) {
    throw new AuthorizationError("Người dùng không được xác thực");
  }

  if (!["admin", "employee"].includes(requestingUser.role)) {
    throw new AuthorizationError("Không có quyền xem thống kê khách hàng");
  }

  // Exclude customers linked to non-customer users (admin, employee)
  const nonCustomerUsers = await User.find({
    role: { $ne: USER_ROLES.CUSTOMER },
  }).select("_id");

  const nonCustomerUserIds = nonCustomerUsers.map((u) => u._id);

  // Filter to only include customers with role='customer' or guest customers
  let filter = {};
  if (nonCustomerUserIds.length > 0) {
    filter.$or = [
      { userId: null }, // Guest customers
      { userId: { $nin: nonCustomerUserIds } }, // Registered customers with role='customer'
    ];
  }

  return await customerRepository.getStats(filter);
};

// Get customer by userId
const getCustomerByUserId = async (userId) => {
  return await customerRepository.findByUserId(userId, {
    populate: { path: "userId", select: "email userName phone" },
  });
};

// Create or update customer for user (when user registers/logs in)
const createOrUpdateCustomerForUser = async (userId) => {
  const Customer = require("../models/customer.model");

  let existingCustomer = await customerRepository.findByUserId(userId);

  if (!existingCustomer) {
    try {
      // Use findOneAndUpdate with upsert to atomically create or get existing customer
      existingCustomer = await Customer.findOneAndUpdate(
        { userId },
        {
          $setOnInsert: {
            userId,
            customerType: "registered",
            firstSeenAt: new Date(),
            lastSeenAt: new Date(),
            totalOrders: 0,
            totalSpent: 0,
          },
        },
        {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true,
        }
      );
    } catch (error) {
      // If duplicate key error (race condition), fetch the existing one
      if (error.code === 11000 || error.name === "MongoServerError") {
        existingCustomer = await customerRepository.findByUserId(userId);
      } else {
        throw error;
      }
    }
  } else {
    // Update last seen
    existingCustomer = await customerRepository.updateById(
      existingCustomer._id,
      { lastSeenAt: new Date() },
      { new: true }
    );
  }

  return existingCustomer;
};

// Get customers by multiple userIds (batch)
const getCustomersByUserIdsBatch = async (userIds) => {
  if (!Array.isArray(userIds) || userIds.length === 0) {
    return [];
  }

  const customers = await Promise.all(
    userIds.map(async (userId) => {
      try {
        const customer = await getCustomerByUserId(userId);
        return customer ? { userId, customer } : { userId, customer: null };
      } catch (error) {
        return { userId, customer: null, error: error.message };
      }
    })
  );

  return customers;
};

// Get users by segmentation type (internal endpoint)
// Returns only registered customers with userId, populated with user info
const getUsersBySegmentationType = async (segmentationType, options = {}) => {
  const page = parseInt(options.page) || 1;
  const limit = parseInt(options.limit) || 1000;
  const skip = (page - 1) * limit;

  const validTypes = ["potential", "loyal", "at_risk", "churned"];
  if (!validTypes.includes(segmentationType)) {
    throw new ValidationError(
      `Loại phân loại không hợp lệ. Phải là một trong: ${validTypes.join(", ")}`
    );
  }

  const Customer = require("../models/customer.model");

  // Step 1: Get all customers filtered by segmentation type
  const filter = {
    "segmentation.type": segmentationType,
    userId: { $exists: true, $ne: null },
    customerType: "registered",
  };

  // Get total count for pagination
  const total = await Customer.countDocuments(filter);

  // Step 2: Get customers with pagination and populate userId
  const customers = await Customer.find(filter)
    .populate({
      path: "userId",
      select: "email userName phone role",
    })
    .sort({ "segmentation.lastAnalyzed": -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  // Step 3: Filter customers to only include those with userId having role = CUSTOMER
  const validCustomers = customers.filter(
    (customer) =>
      customer.userId && customer.userId.role === USER_ROLES.CUSTOMER
  );

  // Step 4: Map customers to extract user information
  const users = validCustomers
    .map((customer) => {
      if (!customer.userId) return null;

      const userId = customer.userId._id || customer.userId;
      return {
        _id: userId,
        name: customer.userId.userName || customer.userId.email || "Unknown",
        email: customer.userId.email || "",
        userName: customer.userId.userName || "",
      };
    })
    .filter((user) => user !== null);

  // Step 5: Remove duplicates by _id (in case same user appears multiple times)
  const uniqueUsers = Array.from(
    new Map(users.map((user) => [user._id.toString(), user])).values()
  );

  return {
    users: uniqueUsers,
    pagination: {
      current: page,
      pageSize: limit,
      total: uniqueUsers.length,
      pages: Math.ceil(total / limit),
    },
  };
};

module.exports = {
  getAllCustomers,
  getCustomerById,
  updateCustomer,
  getCustomerStats,
  getCustomerByUserId,
  createOrUpdateCustomerForUser,
  getCustomersByUserIdsBatch,
  getUsersBySegmentationType,
};
