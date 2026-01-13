const userService = require("../services/user.service");
const cloudinaryUtils = require("../utils/cloudinary");

exports.getProfile = async (req, res, next) => {
  try {
    const user = await userService.getProfile(req.user.id);
    res.json(user);
  } catch (error) {
    next(error);
  }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const user = await userService.updateProfile(req.user.id, req.body);
    res.json(user);
  } catch (error) {
    next(error);
  }
};

exports.register = async (req, res, next) => {
  try {
    const { userName, email, password, agreeTerms } = req.body;
    const newUser = await userService.register({
      userName,
      email,
      password,
      agreeTerms,
    });
    res
      .status(201)
      .json({ message: "User registered successfully", user: newUser });
  } catch (error) {
    next(error);
  }
};

exports.updateRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    const result = await userService.updateRole(id, role, req.user);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

// Lấy danh sách tất cả người dùng (chỉ admin)
exports.getAllUsers = async (req, res, next) => {
  try {
    const result = await userService.getAllUsers(req.query, req.user);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

// Lấy thông tin người dùng theo ID (chỉ admin)
exports.getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await userService.getUserById(id, req.user);
    res.json(user);
  } catch (error) {
    next(error);
  }
};

// Lấy thông tin người dùng theo ID (Internal - không cần auth, dành cho service-to-service)
exports.getUserByIdInternal = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await userService.getUserByIdInternal(id);
    res.json({
      status: "success",
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// Lấy tất cả users (Internal - không cần auth, loại trừ admin và employee)
exports.getAllUsersInternal = async (req, res, next) => {
  try {
    const users = await userService.getAllUsersInternal();
    res.json({
      status: "success",
      data: users,
    });
  } catch (error) {
    next(error);
  }
};

// Cập nhật thông tin người dùng (chỉ admin)
exports.updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await userService.updateUser(id, req.body, req.user);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

// Kích hoạt/vô hiệu hóa tài khoản (chỉ admin)
exports.toggleUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    const result = await userService.toggleUserStatus(id, isActive, req.user);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

// Xóa người dùng (chỉ admin)
exports.deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await userService.deleteUser(id, req.user);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

// Đổi mật khẩu cho người dùng khác (chỉ admin)
exports.changeUserPassword = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;
    const result = await userService.changeUserPassword(
      id,
      newPassword,
      req.user
    );
    res.json(result);
  } catch (error) {
    next(error);
  }
};

// Get user permissions (current user)
exports.getUserPermissions = async (req, res, next) => {
  try {
    const permissions = await userService.getUserPermissions(req.user.id);
    res.json({ permissions });
  } catch (error) {
    next(error);
  }
};

// Get all available permissions constants
exports.getAllPermissions = async (req, res, next) => {
  try {
    const { PERMISSIONS } = require("../constants");
    res.json({ permissions: PERMISSIONS });
  } catch (error) {
    next(error);
  }
};

// Get permissions by role
exports.getRolePermissions = async (req, res, next) => {
  try {
    const { role } = req.params;
    const permissions = userService.getRolePermissions(role);
    res.json({ role, permissions });
  } catch (error) {
    next(error);
  }
};

// Update user custom permissions (admin only)
exports.updateUserPermissions = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { customPermissions } = req.body;
    const result = await userService.updateUserPermissions(
      id,
      customPermissions,
      req.user
    );
    res.json(result);
  } catch (error) {
    next(error);
  }
};

// Upload avatar
exports.uploadAvatar = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        status: "error",
        message: "Không có file ảnh được tải lên",
      });
    }

    // Upload to Cloudinary
    const uploadResult = await cloudinaryUtils.uploadAvatar(
      req.file.buffer,
      req.user.id
    );

    // Update user avatar in database
    const updatedUser = await userService.updateProfile(req.user.id, {
      avatar: uploadResult.url,
    });

    res.json({
      status: "success",
      message: "Upload avatar thành công",
      data: {
        avatar: uploadResult.url,
        user: updatedUser,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Delete avatar
exports.deleteAvatar = async (req, res, next) => {
  try {
    const user = await userService.getProfile(req.user.id);

    if (!user.avatar) {
      return res.status(400).json({
        status: "error",
        message: "Người dùng chưa có avatar",
      });
    }

    // Extract public ID from Cloudinary URL
    const urlParts = user.avatar.split("/");
    const publicIdWithExtension = urlParts.slice(-2).join("/");
    const publicId = publicIdWithExtension.split(".")[0];

    // Delete from Cloudinary
    await cloudinaryUtils.deleteImage(publicId);

    // Remove avatar from database
    const updatedUser = await userService.updateProfile(req.user.id, {
      avatar: null,
    });

    res.json({
      status: "success",
      message: "Xóa avatar thành công",
      data: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};
