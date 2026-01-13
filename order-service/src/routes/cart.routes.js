const express = require("express");
const router = express.Router();
const cartController = require("../controllers/cart.controller");
const { verifyToken } = require("../middlewares/auth.middleware");

// All cart routes require authentication

router.get("/", verifyToken, cartController.getCart);
router.get("/summary", verifyToken, cartController.getCartSummary);
router.post("/items", verifyToken, cartController.addItem);
router.patch("/items/:productId", verifyToken, cartController.updateItem);
router.delete("/items/:productId", verifyToken, cartController.removeItem);
router.delete("/clear", verifyToken, cartController.clearCart);

module.exports = router;
