const express = require("express");
const router = express.Router();
const searchCtrl = require("../controllers/search.controller");

// New autocomplete search endpoint
router.get("/products", searchCtrl.searchProducts);

// Webhook endpoint for Product Service
router.post("/webhook/product", searchCtrl.webhookProduct);

// Legacy endpoints (backward compatibility)
router.get("/", searchCtrl.search);
router.get("/autocomplete", searchCtrl.autocomplete);

module.exports = router;
