const bcrypt = require("bcryptjs");
const { client } = require("../config/redis");
const userRepository = require("../repositories/user.repository");
const userValidator = require("../validators/user.validator");
const { sign, verify } = require("../utils/jwt");
const { ROLE_PERMISSIONS } = require("../constants");
const {
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  ConflictError,
  NotFoundError,
} = require("../errors");
const { USER_ROLES, JWT, REDIS } = require("../constants");
const customerService = require("./customer.service");
const voucherClient = require("../clients/voucher.client");
const emailClient = require("../clients/email.client");

// Register new user
const register = async (userData) => {
  const validatedData = userValidator.validateRegistrationData(userData);

  // Check if email already exists
  const existingUser = await userRepository.findByEmail(validatedData.email);
  if (existingUser) {
    throw new ConflictError("Email đã tồn tại");
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(validatedData.password, 10);
  validatedData.password = hashedPassword;

  // Create user
  const user = await userRepository.create(validatedData);
  const userObject = user.toObject();
  delete userObject.password;

  // Create customer only for users with role='customer'
  if (user.role === USER_ROLES.CUSTOMER) {
    try {
      await customerService.createOrUpdateCustomerForUser(user._id);
    } catch (error) {
      console.error("Error creating customer on register:", error.message);
      // Continue even if customer creation fails
    }

    // Trigger voucher distribution for new user registration
    try {
      const voucherResult = await voucherClient.triggerUserRegisteredVoucher(
        user._id.toString()
      );
      if (voucherResult.success && voucherResult.distributed > 0) {
        console.log(
          `Voucher distributed for new user ${user._id}: ${voucherResult.distributed} voucher(s)`
        );
      }
    } catch (error) {
      console.error("Error triggering voucher on register:", error.message);
      // Continue even if voucher distribution fails - don't break registration
    }
  }

  return {
    message: "Đăng ký thành công",
    user: userObject,
  };
};

// User login - supports email or userName
const login = async (loginData) => {
  const validatedData = userValidator.validateLoginData(loginData);

  // Find user by email or userName
  let user;
  if (validatedData.isEmail) {
    user = await userRepository.findByEmail(validatedData.emailOrUsername);
  } else {
    // Try to find by userName
    user = await userRepository.findOne({
      userName: validatedData.emailOrUsername,
    });
  }

  if (!user) {
    throw new AuthenticationError("Thông tin đăng nhập không tồn tại");
  }

  // Check if user is active
  if (!user.isActive) {
    throw new AuthenticationError("Tài khoản đã bị vô hiệu hóa");
  }

  // Verify password
  const isPasswordValid = await bcrypt.compare(
    validatedData.password,
    user.password
  );
  if (!isPasswordValid) {
    throw new AuthenticationError("Thông tin mật khẩu không chính xác");
  }

  // Create or update customer only for users with role='customer'
  if (user.role === USER_ROLES.CUSTOMER) {
    try {
      await customerService.createOrUpdateCustomerForUser(user._id);
    } catch (error) {
      console.error("Error creating customer on login:", error.message);
      // Continue even if customer creation fails
    }
  }

  // Generate JWT token
  const token = sign(
    {
      id: user._id,
      email: user.email,
      role: user.role,
      permissions: [...ROLE_PERMISSIONS[user.role], ...user.customPermissions],
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );

  const userObject = user.toObject();
  delete userObject.password;

  return {
    token,
    accessToken: token,
    refreshToken: token,
    user: userObject,
  };
};

// CMS Login (Admin only)
const cmsLogin = async (loginData) => {
  const result = await login(loginData);

  // Check if user is allowed to access CMS
  const allowedCmsRoles = [USER_ROLES.ADMIN, USER_ROLES.EMPLOYEE];
  if (!allowedCmsRoles.includes(result.user.role)) {
    throw new AuthorizationError("Bạn không có quyền truy cập CMS");
  }

  return {
    ...result,
    refreshToken: result.token,
  };
};

// Logout user by blacklisting token
const logout = async (token) => {
  if (token && client) {
    await client.set(`bl_${token}`, "1", { EX: REDIS.BLACKLIST_EXPIRY });
  }

  return { message: "Đã logout" };
};

// Forgot password - generate reset token
const forgotPassword = async (email) => {
  const user = await userRepository.findByEmail(email);
  if (!user) {
    throw new NotFoundError("Email không tồn tại");
  }

  // Generate reset token
  const resetToken = await sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: JWT.RESET_TOKEN_EXPIRES_IN,
  });

  // Save reset token to user
  await userRepository.setResetToken(user._id, resetToken);

  // Send password reset email
  try {
    const userName = user.fullName || user.userName || user.email.split("@")[0];
    await emailClient.sendPasswordResetEmail(email, resetToken, userName);
  } catch (error) {
    console.error("Error sending password reset email:", error.message);
    // Don't throw error - still return success to prevent email enumeration
    // Log the error for monitoring
  }

  return {
    message:
      "Email khôi phục mật khẩu đã được gửi. Vui lòng kiểm tra hộp thư của bạn.",
  };
};

// Reset password using reset token
const resetPassword = async (resetToken, newPassword) => {
  if (!resetToken) {
    throw new ValidationError("Reset token là bắt buộc");
  }

  const validatedPassword = userValidator.validatePassword(newPassword);

  try {
    // Verify reset token
    const decoded = await verify(resetToken, process.env.JWT_SECRET);

    // Find user with valid reset token
    const user = await userRepository.findByResetToken(resetToken);
    if (!user || user._id.toString() !== decoded.id) {
      throw new AuthenticationError(
        "Token đặt lại mật khẩu không hợp lệ hoặc đã hết hạn"
      );
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(validatedPassword, 10);

    // Update password and clear reset token
    await userRepository.updatePassword(user._id, hashedPassword);

    return { message: "Mật khẩu đã được đặt lại thành công" };
  } catch (error) {
    if (
      error.name === "JsonWebTokenError" ||
      error.name === "TokenExpiredError"
    ) {
      throw new AuthenticationError(
        "Token đặt lại mật khẩu không hợp lệ hoặc đã hết hạn"
      );
    }
    throw error;
  }
};

// Refresh access token
const refreshToken = async (oldToken) => {
  if (!oldToken) {
    throw new AuthenticationError("Refresh Token không được cung cấp");
  }

  try {
    // Decode token without verification first to get user info even if expired
    const jwt = require("jsonwebtoken");
    let decoded;

    try {
      // Try to verify normally first
      decoded = await verify(oldToken, process.env.JWT_SECRET);
    } catch (verifyError) {
      // If token expired, decode without verification to get user info
      if (verifyError.name === "TokenExpiredError") {
        decoded = jwt.decode(oldToken);
        if (!decoded || !decoded.id) {
          throw new AuthenticationError("Refresh Token không hợp lệ");
        }
      } else {
        throw verifyError;
      }
    }

    // Check if token is blacklisted
    const isBlacklisted = await isTokenBlacklisted(oldToken);
    if (isBlacklisted) {
      throw new AuthenticationError("Token đã bị vô hiệu hóa");
    }

    // Find user
    const user = await userRepository.findById(decoded.id);
    if (!user) {
      throw new NotFoundError("Người dùng không tồn tại");
    }

    if (!user.isActive) {
      throw new AuthenticationError("Tài khoản đã bị vô hiệu hóa");
    }

    // Generate new access token with permissions
    const newAccessToken = await sign(
      {
        id: user._id,
        email: user.email,
        role: user.role,
        permissions: [
          ...ROLE_PERMISSIONS[user.role],
          ...user.customPermissions,
        ],
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    return { accessToken: newAccessToken, token: newAccessToken };
  } catch (error) {
    if (
      error.name === "JsonWebTokenError" ||
      error.name === "TokenExpiredError"
    ) {
      throw new AuthenticationError(
        "Refresh Token không hợp lệ hoặc đã hết hạn"
      );
    }
    throw error;
  }
};

// Create user (Admin only)
const createUser = async (userData, adminUser) => {
  if (!adminUser || adminUser.role !== USER_ROLES.ADMIN) {
    throw new AuthorizationError("Chỉ admin mới có thể tạo tài khoản");
  }

  const validatedData = userValidator.validateAdminCreateUserData(userData);

  // Check if email already exists
  const existingUser = await userRepository.findByEmail(validatedData.email);
  if (existingUser) {
    throw new ConflictError("Email đã tồn tại");
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(validatedData.password, 10);
  validatedData.password = hashedPassword;

  // Create user
  const user = await userRepository.create(validatedData);
  const userObject = user.toObject();
  delete userObject.password;

  return {
    message: "Tạo tài khoản thành công bởi admin",
    user: userObject,
  };
};

// Change password
const changePassword = async (userId, passwordData, token) => {
  const validatedData = userValidator.validateChangePasswordData(passwordData);

  // Find user
  const user = await userRepository.findById(userId);
  if (!user) {
    throw new NotFoundError("Người dùng không tồn tại");
  }

  // Verify current password
  const isCurrentPasswordValid = await bcrypt.compare(
    validatedData.currentPassword,
    user.password
  );
  if (!isCurrentPasswordValid) {
    throw new AuthenticationError("Mật khẩu hiện tại không chính xác");
  }

  // Hash new password
  const hashedNewPassword = await bcrypt.hash(validatedData.newPassword, 10);

  // Update password
  await userRepository.updatePassword(user._id, hashedNewPassword);

  // Blacklist current token to force re-login
  if (token && client) {
    await client.set(`bl_${token}`, "1", { EX: REDIS.BLACKLIST_EXPIRY });
  }

  return { message: "Đổi mật khẩu thành công. Vui lòng đăng nhập lại." };
};

// Check if token is blacklisted
const isTokenBlacklisted = async (token) => {
  if (!token || !client) return false;

  const isBlacklisted = await client.get(`bl_${token}`);
  return !!isBlacklisted;
};

module.exports = {
  register,
  login,
  cmsLogin,
  logout,
  forgotPassword,
  resetPassword,
  refreshToken,
  createUser,
  changePassword,
  isTokenBlacklisted,
};
