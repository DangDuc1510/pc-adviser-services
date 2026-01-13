const createBaseRepository = require("./base.repository");
const Customer = require("../models/customer.model");
const { DatabaseError } = require("../errors");
const mongoose = require("mongoose");

const baseRepo = createBaseRepository(Customer);

// Find customer by userId
const findByUserId = async (userId, options = {}) => {
  try {
    return await baseRepo.findOne({ userId }, options);
  } catch (error) {
    throw new DatabaseError(
      `Error finding customer by userId: ${error.message}`
    );
  }
};

// Get customers with pagination and filters
const findWithPagination = async (
  filter = {},
  page = 1,
  limit = 10,
  options = {}
) => {
  try {
    const skip = (page - 1) * limit;
    const { select, sort = { lastSeenAt: -1 }, populate } = options;

    const [customers, total] = await Promise.all([
      baseRepo.find(filter, { select, sort, skip, limit, populate }),
      baseRepo.count(filter),
    ]);

    return {
      customers,
      pagination: {
        current: page,
        pageSize: limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    throw new DatabaseError(
      `Error finding customers with pagination: ${error.message}`
    );
  }
};

// Search customers
const searchCustomers = async (searchTerm, options = {}) => {
  try {
    const filter = {
      $or: [{ ipAddress: { $regex: searchTerm, $options: "i" } }],
    };

    // Also search in user if populated
    const User = require("../models/user.model");
    const users = await User.find({
      $or: [
        { email: { $regex: searchTerm, $options: "i" } },
        { userName: { $regex: searchTerm, $options: "i" } },
      ],
    }).select("_id");

    if (users.length > 0) {
      filter.$or.push({ userId: { $in: users.map((u) => u._id) } });
    }

    return await baseRepo.find(filter, options);
  } catch (error) {
    throw new DatabaseError(`Error searching customers: ${error.message}`);
  }
};

// Update customer stats (orders and spent)
// If useIncrement is true, uses $inc to increment values, otherwise sets absolute values
const updateStats = async (customerId, stats, useIncrement = false) => {
  try {
    let updateData = {};

    if (useIncrement) {
      // Use $inc to increment values
      updateData = { $inc: {} };
      if (stats.totalOrders !== undefined) {
        updateData.$inc.totalOrders = stats.totalOrders;
      }
      if (stats.totalSpent !== undefined) {
        updateData.$inc.totalSpent = stats.totalSpent;
      }
    } else {
      // Set absolute values
      if (stats.totalOrders !== undefined) {
        updateData.totalOrders = stats.totalOrders;
      }
      if (stats.totalSpent !== undefined) {
        updateData.totalSpent = stats.totalSpent;
      }
    }

    if (useIncrement && Object.keys(updateData.$inc).length === 0) {
      // No fields to update
      return await baseRepo.findById(customerId);
    }
    if (!useIncrement && Object.keys(updateData).length === 0) {
      // No fields to update
      return await baseRepo.findById(customerId);
    }

    return await Customer.findByIdAndUpdate(customerId, updateData, {
      new: true,
    });
  } catch (error) {
    throw new DatabaseError(`Error updating customer stats: ${error.message}`);
  }
};

// Get customer statistics
const getStats = async (filter = {}) => {
  try {
    const [total, registered, guest, totalSpent, totalOrders] =
      await Promise.all([
        baseRepo.count(filter),
        baseRepo.count({ ...filter, customerType: "registered" }),
        baseRepo.count({ ...filter, customerType: "guest" }),
        Customer.aggregate([
          { $match: filter },
          { $group: { _id: null, total: { $sum: "$totalSpent" } } },
        ]),
        Customer.aggregate([
          { $match: filter },
          { $group: { _id: null, total: { $sum: "$totalOrders" } } },
        ]),
      ]);

    return {
      total,
      registered,
      guest,
      totalSpent: totalSpent[0]?.total || 0,
      totalOrders: totalOrders[0]?.total || 0,
    };
  } catch (error) {
    throw new DatabaseError(`Error getting customer stats: ${error.message}`);
  }
};

// Get all customer IDs with metadata (sorted by updatedAt)
// Returns array of { id, userId, updatedAt } sorted by updatedAt (oldest first)
const getAllIdsWithMetadata = async () => {
  console.log("vao day5");
  try {
    // Use aggregation pipeline to safely handle missing updatedAt fields
    const customers = await Customer.aggregate([
      {
        $project: {
          _id: 1,
          userId: 1,
          updatedAt: { $ifNull: ["$updatedAt", "$createdAt"] },
          createdAt: 1,
        },
      },
      {
        $sort: { updatedAt: 1 }, // Sort by updatedAt (or createdAt if updatedAt is null)
      },
    ]);

    const customerData = customers
      .map((c) => {
        if (!c || !c._id) return null;

        try {
          // Handle both ObjectId and string formats for customer ID
          const id =
            c._id && typeof c._id === "object" && c._id.toString
              ? c._id.toString()
              : String(c._id || "");

          if (!id) return null;

          // Handle userId (can be ObjectId, string, or null)
          let userId = null;
          if (c.userId) {
            if (typeof c.userId === "object" && c.userId.toString) {
              // userId is ObjectId
              userId = c.userId.toString();
            } else {
              // userId is already a string
              userId = String(c.userId);
            }
          }

          return {
            id: userId,
            updatedAt: c.updatedAt || c.createdAt || new Date(),
          };
        } catch (mapError) {
          console.error(
            "[getAllIdsWithMetadata] Error mapping customer:",
            mapError,
            c
          );
          return null;
        }
      })
      .filter((c) => c !== null); // Filter out any null entries
    console.log("customerData", customerData);
    return customerData;
  } catch (error) {
    throw new DatabaseError(`Error getting all customer IDs: ${error.message}`);
  }
};

module.exports = {
  ...baseRepo,
  findByUserId,
  findWithPagination,
  searchCustomers,
  updateStats,
  getStats,
  getAllIdsWithMetadata,
};
