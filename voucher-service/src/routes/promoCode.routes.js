const express = require("express");
const router = express.Router();
const promoCodeController = require("../controllers/promoCode.controller");
const { verifyToken } = require("../middlewares/auth.middleware");
const { authorize } = require("../middlewares/permission.middleware");

// Public routes (require auth but not admin)
router.post("/validate", verifyToken, promoCodeController.validatePromoCode);
router.get("/valid", verifyToken, promoCodeController.getValidPromoCodes);

// Admin/Manager routes - Promo codes management requires manager or admin role
router.use(verifyToken);

router.get(
  "/",
  authorize(["admin", "employee"]),
  promoCodeController.getAllPromoCodes
);
router.get(
  "/stats",
  authorize(["admin", "employee"]),
  promoCodeController.getStats
);
router.get(
  "/code/:code",
  authorize(["admin", "employee"]),
  promoCodeController.getPromoCodeByCode
);
router.get(
  "/:id",
  authorize(["admin", "employee"]),
  promoCodeController.getPromoCodeById
);
router.post(
  "/",
  authorize(["admin", "employee"]),
  promoCodeController.createPromoCode
);
router.put(
  "/:id",
  authorize(["admin", "employee"]),
  promoCodeController.updatePromoCode
);
router.patch(
  "/:id/toggle-active",
  authorize(["admin", "employee"]),
  promoCodeController.toggleActive
);
router.delete(
  "/:id",
  authorize(["admin", "employee"]),
  promoCodeController.deletePromoCode
);

module.exports = router;
