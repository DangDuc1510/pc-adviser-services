const express = require("express");
const router = express.Router();
const emailController = require("../controllers/email.controller");

// Verify email service
router.get("/verify", emailController.verifyEmailService);

// Send email (supports both text and HTML)
router.post("/send", emailController.sendEmail);

// Send HTML email
router.post("/send/html", emailController.sendHtmlEmail);

// Send plain text email
router.post("/send/text", emailController.sendTextEmail);

// Send bulk email
router.post("/send/bulk", emailController.sendBulkEmail);

module.exports = router;
