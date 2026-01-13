const nodemailer = require("nodemailer");
const config = require("../config");
const logger = require("../utils/logger");

class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  /**
   * Initialize nodemailer transporter
   */
  initializeTransporter() {
    try {
      if (!config.email.smtp.auth.user || !config.email.smtp.auth.pass) {
        logger.warn(
          "Email configuration incomplete. Email service will not be available."
        );
        return;
      }

      this.transporter = nodemailer.createTransport({
        host: config.email.smtp.host,
        port: config.email.smtp.port,
        secure: config.email.smtp.secure,
        auth: {
          user: config.email.smtp.auth.user,
          pass: config.email.smtp.auth.pass,
        },
      });

      logger.info("Email transporter initialized", {
        host: config.email.smtp.host,
        port: config.email.smtp.port,
      });
    } catch (error) {
      logger.error("Failed to initialize email transporter", {
        error: error.message,
      });
    }
  }

  /**
   * Verify email transporter connection
   */
  async verifyConnection() {
    if (!this.transporter) {
      return false;
    }

    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      logger.error("Email transporter verification failed", {
        error: error.message,
      });
      return false;
    }
  }

  /**
   * Send email
   * @param {Object} options - Email options
   * @param {string|string[]} options.to - Recipient email(s)
   * @param {string} options.subject - Email subject
   * @param {string} options.text - Plain text content
   * @param {string} options.html - HTML content
   * @param {string|string[]} options.cc - CC email(s) (optional)
   * @param {string|string[]} options.bcc - BCC email(s) (optional)
   * @param {Array} options.attachments - Attachments (optional)
   * @returns {Promise<Object>} - Send result
   */
  async sendEmail(options) {
    if (!this.transporter) {
      throw new Error(
        "Email service is not configured. Please check SMTP settings."
      );
    }

    const { to, subject, text, html, cc, bcc, attachments } = options;

    if (!to || !subject || (!text && !html)) {
      throw new Error(
        "Missing required email fields: to, subject, and text/html"
      );
    }

    const mailOptions = {
      from: `"${config.email.fromName}" <${config.email.from}>`,
      to: Array.isArray(to) ? to.join(", ") : to,
      subject,
      text,
      html,
    };

    if (cc) {
      mailOptions.cc = Array.isArray(cc) ? cc.join(", ") : cc;
    }

    if (bcc) {
      mailOptions.bcc = Array.isArray(bcc) ? bcc.join(", ") : bcc;
    }

    if (attachments && Array.isArray(attachments)) {
      mailOptions.attachments = attachments;
    }

    try {
      const info = await this.transporter.sendMail(mailOptions);
      logger.info("Email sent successfully", {
        messageId: info.messageId,
        to: mailOptions.to,
        subject,
      });

      return {
        success: true,
        messageId: info.messageId,
        response: info.response,
      };
    } catch (error) {
      logger.error("Failed to send email", {
        error: error.message,
        to: mailOptions.to,
        subject,
      });
      throw error;
    }
  }

  /**
   * Send HTML email
   * @param {Object} options - Email options
   * @param {string|string[]} options.to - Recipient email(s)
   * @param {string} options.subject - Email subject
   * @param {string} options.html - HTML content
   * @param {string} options.text - Plain text fallback (optional)
   * @returns {Promise<Object>} - Send result
   */
  async sendHtmlEmail(options) {
    return this.sendEmail({
      ...options,
      text: options.text || this.htmlToText(options.html),
    });
  }

  /**
   * Send plain text email
   * @param {Object} options - Email options
   * @param {string|string[]} options.to - Recipient email(s)
   * @param {string} options.subject - Email subject
   * @param {string} options.text - Plain text content
   * @returns {Promise<Object>} - Send result
   */
  async sendTextEmail(options) {
    return this.sendEmail({
      ...options,
      html: undefined,
    });
  }

  /**
   * Convert HTML to plain text (simple implementation)
   * @param {string} html - HTML content
   * @returns {string} - Plain text
   */
  htmlToText(html) {
    if (!html) return "";
    return html
      .replace(/<[^>]*>/g, "")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .trim();
  }

  /**
   * Send email to multiple recipients
   * @param {Object} options - Email options
   * @param {string[]} options.to - Array of recipient emails
   * @param {string} options.subject - Email subject
   * @param {string} options.text - Plain text content
   * @param {string} options.html - HTML content
   * @returns {Promise<Object>} - Send result
   */
  async sendBulkEmail(options) {
    if (!Array.isArray(options.to) || options.to.length === 0) {
      throw new Error("Recipients must be a non-empty array");
    }

    return this.sendEmail(options);
  }
}

module.exports = new EmailService();
