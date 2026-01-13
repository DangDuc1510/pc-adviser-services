const express = require("express");
const router = express.Router();
const authCtrl = require("../controllers/auth.controller");
const { authenticate, authorize } = require("../middlewares/auth.middleware"); // Import authenticate and authorize

// health check
router.get("/health", (req, res) => {
  res.json({
    message: "Identity Service - Auth Routes is running",
    status: "ok",
  });
});

router.post("/register", authCtrl.register);
router.post("/login", authCtrl.login);
router.post("/cms-login", authCtrl.cmsLogin);
router.post("/logout", authCtrl.logout);
router.post("/forgot-password", authCtrl.forgotPassword);
router.post("/reset-password", authCtrl.resetPassword);
router.post("/refresh-token", authCtrl.refreshToken);
router.post("/change-password", authenticate, authCtrl.changePassword);

router.post(
  "/admin/create",
  authenticate,
  authorize(["admin"]),
  authCtrl.create
);

module.exports = router;
