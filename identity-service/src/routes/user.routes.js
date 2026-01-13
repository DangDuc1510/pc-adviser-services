const express = require("express");
const router = express.Router();
const userCtrl = require("../controllers/user.controller");
const {
  authenticate,
  authorize,
  checkPermission,
} = require("../middlewares/auth.middleware");
const { handleAvatarUpload } = require("../middlewares/upload.middleware");
const { PERMISSIONS } = require("../constants");

// health check
router.get("/health", (req, res) => {
  res.json({
    message: "Identity Service - User Routes is running",
    status: "ok",
  });
});

// Internal service-to-service routes (no auth required)
// These endpoints are for internal microservice communication only
router.get("/internal/users", userCtrl.getAllUsersInternal);
router.get("/internal/users/:id", userCtrl.getUserByIdInternal);

// User profile routes (authenticated users)
router.get("/profile", authenticate, userCtrl.getProfile);
router.put("/profile", authenticate, userCtrl.updateProfile);

// Avatar upload routes
router.post("/avatar", authenticate, handleAvatarUpload, userCtrl.uploadAvatar);
router.post(
  "/upload-avatar",
  authenticate,
  handleAvatarUpload,
  userCtrl.uploadAvatar
);
router.delete("/delete-avatar", authenticate, userCtrl.deleteAvatar);

// User management routes with permission checks
router.get(
  "/users",
  authenticate,
  checkPermission([PERMISSIONS.VIEW_USERS]),
  userCtrl.getAllUsers
);
router.get(
  "/users/:id",
  authenticate,
  checkPermission([PERMISSIONS.VIEW_USERS]),
  userCtrl.getUserById
);
router.put(
  "/users/:id",
  authenticate,
  checkPermission([PERMISSIONS.EDIT_USERS]),
  userCtrl.updateUser
);
router.put(
  "/users/:id/role",
  authenticate,
  checkPermission([PERMISSIONS.MANAGE_USER_ROLES]),
  userCtrl.updateRole
);
router.put(
  "/users/:id/status",
  authenticate,
  checkPermission([PERMISSIONS.EDIT_USERS]),
  userCtrl.toggleUserStatus
);
router.put(
  "/users/:id/password",
  authenticate,
  checkPermission([PERMISSIONS.EDIT_USERS]),
  userCtrl.changeUserPassword
);
router.delete(
  "/users/:id",
  authenticate,
  checkPermission([PERMISSIONS.DELETE_USERS]),
  userCtrl.deleteUser
);

// Permission management routes
router.get("/permissions", authenticate, userCtrl.getUserPermissions);
router.get("/permissions/all", authenticate, userCtrl.getAllPermissions);
router.get(
  "/roles/:role/permissions",
  authenticate,
  checkPermission([PERMISSIONS.MANAGE_USER_ROLES]),
  userCtrl.getRolePermissions
);
router.put(
  "/users/:id/permissions",
  authenticate,
  checkPermission([PERMISSIONS.MANAGE_USER_ROLES]),
  userCtrl.updateUserPermissions
);

module.exports = router;
