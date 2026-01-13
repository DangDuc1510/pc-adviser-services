const bcrypt = require("bcryptjs");
const userRepository = require("../repositories/user.repository");
const userValidator = require("../validators/user.validator");
const {
  ValidationError,
  AuthorizationError,
  NotFoundError,
} = require("../errors");
const {
  USER_ROLES,
  PAGINATION,
  ROLE_PERMISSIONS,
  PERMISSIONS,
} = require("../constants");
const User = require("../models/user.model");
// Get user profile
const getProfile = async (userId) => {
  const user = await userRepository.findById(userId, {
    select: "-password -resetPasswordToken -resetPasswordExpires",
  });

  if (!user) {
    throw new NotFoundError("Người dùng không tồn tại");
  }

  return user;
};

// Register new user
const register = async ({ userName, email, password, agreeTerms }) => {
  userValidator.validateRegistrationData({
    userName,
    email,
    password,
    agreeTerms,
  });

  const existingUser = await userRepository.findByEmailOrUsername(
    email,
    userName
  );
  if (existingUser) {
    throw new ValidationError("Tên đăng nhập hoặc Email đã tồn tại");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = await userRepository.create({
    userName,
    email,
    password: hashedPassword,
    role: USER_ROLES.CUSTOMER,
    isActive: true, // New users are active by default
    agreeTerms,
  });

  // Trigger voucher for user registration (async, don't wait)
  try {
    const voucherClient = require('../clients/voucher.client');
    voucherClient.triggerUserRegistered(newUser._id.toString()).catch(err => {
      console.error('Error triggering voucher for user registration:', err.message);
    });
  } catch (error) {
    console.error('Error loading voucher client:', error.message);
  }

  // Return user without password and sensitive tokens
  const userObject = newUser.toObject();
  delete userObject.password;
  delete userObject.resetPasswordToken;
  delete userObject.resetPasswordExpires;
  return userObject;
};

// Update user profile
const updateProfile = async (userId, updateData) => {
  const validatedData = userValidator.validateUpdateProfileData(updateData);

  // Remove sensitive fields
  delete validatedData.password;
  delete validatedData.role;
  delete validatedData.isActive;
  delete validatedData.resetPasswordToken;
  delete validatedData.resetPasswordExpires;

  const user = await userRepository.updateById(userId, validatedData, {
    new: true,
    select: "-password -resetPasswordToken -resetPasswordExpires",
  });

  if (!user) {
    throw new NotFoundError("Người dùng không tồn tại");
  }

  return user;
};

// Get all users (Admin only)
const getAllUsers = async (queryParams, requestingUser) => {
  // Check if requesting user has 'view_users' permission
  // This relies on the checkPermission middleware in API Gateway and Identity Service routes
  if (!requestingUser || !requestingUser.id) {
    throw new AuthorizationError("Người dùng không được xác thực");
  }

  // No explicit role check here, as authorization is handled by checkPermission middleware
  // Ensure the route applying this service method is protected by checkPermission('view_users')

  // Validate pagination parameters
  const { page, limit } = userValidator.validatePaginationParams(queryParams);

  // Validate search and filter parameters
  const filter = userValidator.validateSearchParams(queryParams);

  return await userRepository.findWithPagination(filter, page, limit);
};

// Get user by ID (Admin only)
const getUserById = async (userId, requestingUser) => {
  if (!requestingUser || requestingUser.role !== USER_ROLES.ADMIN) {
    throw new AuthorizationError(
      "Chỉ admin mới có thể xem thông tin người dùng"
    );
  }

  const user = await userRepository.findById(userId, {
    select: "-password -resetPasswordToken -resetPasswordExpires",
  });

  if (!user) {
    throw new NotFoundError("Người dùng không tồn tại");
  }

  return user;
};

// Get user by ID (Internal service call - no auth required)
const getUserByIdInternal = async (userId) => {
  const user = await userRepository.findById(userId, {
    select: "-password -resetPasswordToken -resetPasswordExpires",
  });

  if (!user) {
    throw new NotFoundError("Người dùng không tồn tại");
  }

  return user;
};

// Get all users internal (no pagination, exclude admin and employee)
const getAllUsersInternal = async () => {
  const filter = {
    role: { $nin: [USER_ROLES.ADMIN, USER_ROLES.EMPLOYEE] },
  };

  const users = await userRepository.findAllWithoutPagination(filter, {
    select: "_id email userName role isActive createdAt updatedAt",
    sort: { createdAt: -1 },
  });

  return users;
};

// Update user (Admin only)
const updateUser = async (userId, updateData, requestingUser) => {
  if (!requestingUser || requestingUser.role !== USER_ROLES.ADMIN) {
    throw new AuthorizationError(
      "Chỉ admin mới có thể cập nhật thông tin người dùng"
    );
  }

  const validatedData = userValidator.validateUpdateProfileData(updateData);

  // Remove sensitive fields that shouldn't be updated via this method
  delete validatedData.password;
  delete validatedData.resetPasswordToken;
  delete validatedData.resetPasswordExpires;

  const user = await userRepository.updateById(userId, validatedData, {
    new: true,
    select: "-password -resetPasswordToken -resetPasswordExpires",
  });

  if (!user) {
    throw new NotFoundError("Người dùng không tồn tại");
  }

  return {
    message: "Cập nhật thông tin người dùng thành công",
    user,
  };
};

// Update user role (Admin only)
const updateRole = async (userId, newRole, requestingUser) => {
  if (!requestingUser || requestingUser.role !== USER_ROLES.ADMIN) {
    throw new AuthorizationError(
      "Chỉ admin mới có thể cập nhật vai trò người dùng"
    );
  }

  const validatedRole = userValidator.validateRole(newRole);

  const user = await userRepository.updateRole(userId, validatedRole);
  if (!user) {
    throw new NotFoundError("Người dùng không tồn tại");
  }

  // Remove sensitive data
  const userObject = user.toObject();
  delete userObject.password;
  delete userObject.resetPasswordToken;
  delete userObject.resetPasswordExpires;

  return {
    message: "Cập nhật vai trò thành công",
    user: userObject,
  };
};

// Toggle user status (Admin only)
const toggleUserStatus = async (userId, isActive, requestingUser) => {
  if (!requestingUser || requestingUser.role !== USER_ROLES.ADMIN) {
    throw new AuthorizationError(
      "Chỉ admin mới có thể thay đổi trạng thái tài khoản"
    );
  }

  if (typeof isActive !== "boolean") {
    throw new ValidationError("Trạng thái phải là true hoặc false");
  }

  const user = await userRepository.toggleStatus(userId, isActive);
  if (!user) {
    throw new NotFoundError("Người dùng không tồn tại");
  }

  // Remove sensitive data
  const userObject = user.toObject();
  delete userObject.password;
  delete userObject.resetPasswordToken;
  delete userObject.resetPasswordExpires;

  const action = isActive ? "kích hoạt" : "vô hiệu hóa";
  return {
    message: `Đã ${action} tài khoản thành công`,
    user: userObject,
  };
};

// Delete user (Admin only)
const deleteUser = async (userId, requestingUser) => {
  if (!requestingUser || requestingUser.role !== USER_ROLES.ADMIN) {
    throw new AuthorizationError("Chỉ admin mới có thể xóa người dùng");
  }

  // Don't allow admin to delete themselves
  if (userId === requestingUser.id) {
    throw new ValidationError("Không thể xóa chính tài khoản của mình");
  }

  const user = await userRepository.deleteById(userId);
  if (!user) {
    throw new NotFoundError("Người dùng không tồn tại");
  }

  return { message: "Xóa người dùng thành công" };
};

// Change user password (Admin only)
const changeUserPassword = async (userId, newPassword, requestingUser) => {
  if (!requestingUser || requestingUser.role !== USER_ROLES.ADMIN) {
    throw new AuthorizationError(
      "Chỉ admin mới có thể thay đổi mật khẩu người dùng"
    );
  }

  const validatedPassword = userValidator.validatePassword(newPassword);

  // Hash new password
  const hashedPassword = await bcrypt.hash(validatedPassword, 10);

  const user = await userRepository.updatePassword(userId, hashedPassword);
  if (!user) {
    throw new NotFoundError("Người dùng không tồn tại");
  }

  // Remove sensitive data
  const userObject = user.toObject();
  delete userObject.password;
  delete userObject.resetPasswordToken;
  delete userObject.resetPasswordExpires;

  return {
    message: "Đổi mật khẩu thành công",
    user: userObject,
  };
};

// Search users
const searchUsers = async (searchTerm, requestingUser) => {
  if (!requestingUser || requestingUser.role !== USER_ROLES.ADMIN) {
    throw new AuthorizationError("Chỉ admin mới có thể tìm kiếm người dùng");
  }

  if (!searchTerm || typeof searchTerm !== "string") {
    throw new ValidationError("Từ khóa tìm kiếm là bắt buộc");
  }

  const users = await userRepository.searchUsers(searchTerm.trim(), {
    select: "-password -resetPasswordToken -resetPasswordExpires",
  });

  return users;
};

// Get users by role
const getUsersByRole = async (role, requestingUser) => {
  if (!requestingUser || requestingUser.role !== USER_ROLES.ADMIN) {
    throw new AuthorizationError(
      "Chỉ admin mới có thể lọc người dùng theo vai trò"
    );
  }

  const validatedRole = userValidator.validateRole(role);

  const users = await userRepository.findByRole(validatedRole, {
    select: "-password -resetPasswordToken -resetPasswordExpires",
  });

  return users;
};

// Get user statistics (Admin only)
const getUserStats = async (requestingUser) => {
  if (!requestingUser || requestingUser.role !== USER_ROLES.ADMIN) {
    throw new AuthorizationError(
      "Chỉ admin mới có thể xem thống kê người dùng"
    );
  }

  const [totalUsers, activeUsers, inactiveUsers, adminUsers, customerUsers] =
    await Promise.all([
      userRepository.count(),
      userRepository.count({ isActive: true }),
      userRepository.count({ isActive: false }),
      userRepository.count({ role: USER_ROLES.ADMIN }),
      userRepository.count({ role: USER_ROLES.CUSTOMER }),
    ]);

  return {
    total: totalUsers,
    active: activeUsers,
    inactive: inactiveUsers,
    byRole: {
      admin: adminUsers,
      customer: customerUsers,
    },
  };
};

// Get user permissions
const getUserPermissions = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new NotFoundError("Người dùng không tồn tại");
  }

  // Lấy permissions từ role
  const rolePermissions = ROLE_PERMISSIONS[user.role] || [];

  // Merge với custom permissions
  const allPermissions = [
    ...new Set([...rolePermissions, ...(user.customPermissions || [])]),
  ];

  return allPermissions;
};

// Get permissions by role
const getRolePermissions = (role) => {
  if (!Object.values(USER_ROLES).includes(role)) {
    throw new ValidationError("Vai trò không hợp lệ");
  }
  return ROLE_PERMISSIONS[role] || [];
};

// Update user custom permissions (Admin only)
const updateUserPermissions = async (
  userId,
  customPermissions,
  requestingUser
) => {
  if (!requestingUser || requestingUser.role !== USER_ROLES.ADMIN) {
    throw new AuthorizationError(
      "Chỉ admin mới có thể cập nhật quyền người dùng"
    );
  }

  // Validate permissions
  const validPermissions = Object.values(PERMISSIONS);
  const invalidPerms = customPermissions.filter(
    (p) => !validPermissions.includes(p)
  );

  if (invalidPerms.length > 0) {
    throw new ValidationError(`Quyền không hợp lệ: ${invalidPerms.join(", ")}`);
  }

  const user = await User.findByIdAndUpdate(
    userId,
    { customPermissions },
    { new: true }
  ).select("-password -resetPasswordToken -resetPasswordExpires");

  if (!user) {
    throw new NotFoundError("Người dùng không tồn tại");
  }

  return {
    message: "Cập nhật quyền thành công",
    user,
  };
};

module.exports = {
  getProfile,
  register,
  updateProfile,
  getAllUsers,
  getUserById,
  getUserByIdInternal,
  getAllUsersInternal,
  updateUser,
  updateRole,
  toggleUserStatus,
  deleteUser,
  changeUserPassword,
  searchUsers,
  getUsersByRole,
  getUserStats,
  getUserPermissions,
  getRolePermissions,
  updateUserPermissions,
};
