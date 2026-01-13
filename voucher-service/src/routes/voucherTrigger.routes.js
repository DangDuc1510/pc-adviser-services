const express = require('express');
const router = express.Router();
const voucherTriggerController = require('../controllers/voucherTrigger.controller');

// Internal API endpoint for external services to trigger voucher distribution
// No auth middleware - uses JWT_SECRET in request body for authentication
router.post('/trigger', voucherTriggerController.handleTrigger);

module.exports = router;
