const createBaseRepository = require("./base.repository");
const User = require("../models/user.model");
const { DatabaseError } = require("../errors");

// Tạo base repository functions cho User model
const baseRepo = createBaseRepository(User);

// Find user by email
const findByEmail = async (email, options = {}) => {
  return await baseRepo.findOne({ email }, options);
};

// Find user by email or userName
const findByEmailOrUsername = async (email, userName, options = {}) => {
  try {
    return await baseRepo.findOne({ $or: [{ email }, { userName }] }, options);
  } catch (error) {
    throw new DatabaseError(
      `Error finding user by email or userName: ${error.message}`
    );
  }
};

// Check if email exists
const emailExists = async (email) => {
  return await baseRepo.exists({ email });
};

// Get users with pagination and filters
const findWithPagination = async (
  filter = {},
  page = 1,
  limit = 10,
  options = {}
) => {
  try {
    const skip = (page - 1) * limit;
    const {
      select = "-password -resetPasswordToken -resetPasswordExpires",
      sort = { createdAt: -1 },
    } = options;

    const [users, total] = await Promise.all([
      baseRepo.find(filter, { select, sort, skip, limit }),
      baseRepo.count(filter),
    ]);

    return {
      users,
      pagination: {
        current: page,
        pageSize: limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    throw new DatabaseError(
      `Error finding users with pagination: ${error.message}`
    );
  }
};

// Search users by userName or email
const searchUsers = async (searchTerm, options = {}) => {
  const filter = {
    $or: [
      { userName: { $regex: searchTerm, $options: "i" } },
      { email: { $regex: searchTerm, $options: "i" } },
    ],
  };

  return await baseRepo.find(filter, options);
};

// Find users by role
const findByRole = async (role, options = {}) => {
  return await baseRepo.find({ role }, options);
};

// Find active/inactive users
const findByStatus = async (isActive, options = {}) => {
  return await baseRepo.find({ isActive }, options);
};

// Update user password
const updatePassword = async (userId, hashedPassword) => {
  try {
    return await baseRepo.updateById(userId, {
      password: hashedPassword,
      resetPasswordToken: undefined,
      resetPasswordExpires: undefined,
    });
  } catch (error) {
    throw new DatabaseError(`Error updating user password: ${error.message}`);
  }
};

// Update user role
const updateRole = async (userId, role) => {
  try {
    return await baseRepo.updateById(userId, { role });
  } catch (error) {
    throw new DatabaseError(`Error updating user role: ${error.message}`);
  }
};

// Toggle user status
const toggleStatus = async (userId, isActive) => {
  try {
    return await baseRepo.updateById(userId, { isActive });
  } catch (error) {
    throw new DatabaseError(`Error toggling user status: ${error.message}`);
  }
};

// Set reset password token
const setResetToken = async (userId, resetToken) => {
  try {
    return await baseRepo.updateById(userId, {
      resetPasswordToken: resetToken,
      resetPasswordExpires: Date.now() + 3600000, // 1 hour
    });
  } catch (error) {
    throw new DatabaseError(`Error setting reset token: ${error.message}`);
  }
};

// Find user by reset token
const findByResetToken = async (resetToken) => {
  try {
    return await baseRepo.findOne({
      resetPasswordToken: resetToken,
      resetPasswordExpires: { $gt: Date.now() },
    });
  } catch (error) {
    throw new DatabaseError(
      `Error finding user by reset token: ${error.message}`
    );
  }
};

// Clear reset token
const clearResetToken = async (userId) => {
  try {
    return await baseRepo.updateById(userId, {
      resetPasswordToken: undefined,
      resetPasswordExpires: undefined,
    });
  } catch (error) {
    throw new DatabaseError(`Error clearing reset token: ${error.message}`);
  }
};

// Find all users without pagination (for internal use)
const findAllWithoutPagination = async (filter = {}, options = {}) => {
  try {
    const {
      select = "-password -resetPasswordToken -resetPasswordExpires",
      sort = { createdAt: -1 },
    } = options;

    return await baseRepo.find(filter, { select, sort });
  } catch (error) {
    throw new DatabaseError(
      `Error finding all users: ${error.message}`
    );
  }
};

module.exports = {
  // Base repository functions
  ...baseRepo,

  // Custom user repository functions
  findByEmail,
  emailExists,
  findByEmailOrUsername,
  findWithPagination,
  searchUsers,
  findByRole,
  findByStatus,
  updatePassword,
  updateRole,
  toggleStatus,
  setResetToken,
  findByResetToken,
  clearResetToken,
  findAllWithoutPagination,
};
