const express = require("express");
const router = express.Router();
const promoCodeController = require("../controllers/promoCode.controller");

// Internal endpoints for service-to-service calls (no auth required)
router.post("/validate", promoCodeController.validatePromoCodeInternal);
router.post("/record-usage", promoCodeController.recordUsage);

module.exports = router;
