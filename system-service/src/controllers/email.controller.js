const emailService = require("../services/email.service");
const logger = require("../utils/logger");

/**
 * Send email
 */
const sendEmail = async (req, res) => {
  try {
    const { to, subject, text, html, cc, bcc, attachments } = req.body;

    if (!to || !subject || (!text && !html)) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields",
        message: "to, subject, and text/html are required",
      });
    }

    const result = await emailService.sendEmail({
      to,
      subject,
      text,
      html,
      cc,
      bcc,
      attachments,
    });

    res.status(200).json({
      success: true,
      message: "Email sent successfully",
      data: result,
    });
  } catch (error) {
    logger.error("Error sending email", { error: error.message });
    res.status(500).json({
      success: false,
      error: "Failed to send email",
      message: error.message,
    });
  }
};

/**
 * Send HTML email
 */
const sendHtmlEmail = async (req, res) => {
  try {
    const { to, subject, html, text } = req.body;

    if (!to || !subject || !html) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields",
        message: "to, subject, and html are required",
      });
    }

    const result = await emailService.sendHtmlEmail({
      to,
      subject,
      html,
      text,
    });

    res.status(200).json({
      success: true,
      message: "HTML email sent successfully",
      data: result,
    });
  } catch (error) {
    logger.error("Error sending HTML email", { error: error.message });
    res.status(500).json({
      success: false,
      error: "Failed to send HTML email",
      message: error.message,
    });
  }
};

/**
 * Send plain text email
 */
const sendTextEmail = async (req, res) => {
  try {
    const { to, subject, text } = req.body;

    if (!to || !subject || !text) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields",
        message: "to, subject, and text are required",
      });
    }

    const result = await emailService.sendTextEmail({
      to,
      subject,
      text,
    });

    res.status(200).json({
      success: true,
      message: "Text email sent successfully",
      data: result,
    });
  } catch (error) {
    logger.error("Error sending text email", { error: error.message });
    res.status(500).json({
      success: false,
      error: "Failed to send text email",
      message: error.message,
    });
  }
};

/**
 * Send bulk email
 */
const sendBulkEmail = async (req, res) => {
  try {
    const { to, subject, text, html } = req.body;

    if (!Array.isArray(to) || to.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Invalid recipients",
        message: "to must be a non-empty array",
      });
    }

    if (!subject || (!text && !html)) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields",
        message: "subject and text/html are required",
      });
    }

    const result = await emailService.sendBulkEmail({
      to,
      subject,
      text,
      html,
    });

    res.status(200).json({
      success: true,
      message: "Bulk email sent successfully",
      data: result,
    });
  } catch (error) {
    logger.error("Error sending bulk email", { error: error.message });
    res.status(500).json({
      success: false,
      error: "Failed to send bulk email",
      message: error.message,
    });
  }
};

/**
 * Verify email service connection
 */
const verifyEmailService = async (req, res) => {
  try {
    const isConnected = await emailService.verifyConnection();

    if (!isConnected) {
      return res.status(503).json({
        success: false,
        status: "unavailable",
        message: "Email service is not configured or connection failed",
      });
    }

    res.status(200).json({
      success: true,
      status: "available",
      message: "Email service is ready",
    });
  } catch (error) {
    logger.error("Error verifying email service", { error: error.message });
    res.status(500).json({
      success: false,
      status: "error",
      message: error.message,
    });
  }
};

module.exports = {
  sendEmail,
  sendHtmlEmail,
  sendTextEmail,
  sendBulkEmail,
  verifyEmailService,
};
