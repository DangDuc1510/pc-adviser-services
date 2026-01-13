const axios = require("axios");

class EmailClient {
  constructor() {
    this.baseURL =
      process.env.SYSTEM_SERVICE_URL || "http://localhost:3007";
  }

  /**
   * Send password reset email
   * @param {string} to - Recipient email
   * @param {string} resetToken - Password reset token
   * @param {string} userName - User name (optional)
   * @returns {Promise<Object>}
   */
  async sendPasswordResetEmail(to, resetToken, userName = null) {
    try {
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:4001";
      const resetLink = `${frontendUrl}/dat-lai-mat-khau?token=${resetToken}`;

      const emailHtml = this.getPasswordResetEmailTemplate(
        userName || "Người dùng",
        resetLink
      );

      const emailText = this.getPasswordResetEmailText(userName || "Người dùng", resetLink);

      const response = await axios.post(
        `${this.baseURL}/email/send/html`,
        {
          to,
          subject: "Khôi phục mật khẩu - PC Adviser",
          html: emailHtml,
          text: emailText,
        },
        {
          timeout: 10000,
        }
      );

      return response.data;
    } catch (error) {
      console.error("Error sending password reset email:", error.message);
      throw new Error(
        `Failed to send password reset email: ${error.message}`
      );
    }
  }

  /**
   * Get password reset email HTML template
   * @param {string} userName - User name
   * @param {string} resetLink - Password reset link
   * @returns {string} HTML email template
   */
  getPasswordResetEmailTemplate(userName, resetLink) {
    return `
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Khôi phục mật khẩu</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
            <td style="padding: 20px 0; text-align: center;">
                <table role="presentation" style="width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);">
                    <tr>
                        <td style="padding: 40px 40px 20px; text-align: center; background-color: #1890ff; border-radius: 8px 8px 0 0;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">PC Adviser</h1>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 40px;">
                            <h2 style="margin: 0 0 20px; color: #333333; font-size: 24px;">Khôi phục mật khẩu</h2>
                            <p style="margin: 0 0 20px; color: #666666; font-size: 16px; line-height: 1.6;">
                                Xin chào <strong>${userName}</strong>,
                            </p>
                            <p style="margin: 0 0 20px; color: #666666; font-size: 16px; line-height: 1.6;">
                                Chúng tôi nhận được yêu cầu khôi phục mật khẩu cho tài khoản của bạn. Vui lòng nhấp vào nút bên dưới để đặt lại mật khẩu mới.
                            </p>
                            <div style="text-align: center; margin: 30px 0;">
                                <a href="${resetLink}" style="display: inline-block; padding: 14px 32px; background-color: #1890ff; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: 500;">Đặt lại mật khẩu</a>
                            </div>
                            <p style="margin: 20px 0 0; color: #999999; font-size: 14px; line-height: 1.6;">
                                Hoặc sao chép và dán liên kết sau vào trình duyệt của bạn:
                            </p>
                            <p style="margin: 10px 0 20px; color: #1890ff; font-size: 14px; word-break: break-all;">
                                ${resetLink}
                            </p>
                            <p style="margin: 20px 0 0; color: #999999; font-size: 12px; line-height: 1.6;">
                                <strong>Lưu ý:</strong> Liên kết này sẽ hết hạn sau 1 giờ. Nếu bạn không yêu cầu khôi phục mật khẩu, vui lòng bỏ qua email này.
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 20px 40px; background-color: #f5f5f5; border-radius: 0 0 8px 8px; text-align: center;">
                            <p style="margin: 0; color: #999999; font-size: 12px;">
                                © ${new Date().getFullYear()} PC Adviser. Tất cả quyền được bảo lưu.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    `;
  }

  /**
   * Get password reset email plain text
   * @param {string} userName - User name
   * @param {string} resetLink - Password reset link
   * @returns {string} Plain text email
   */
  getPasswordResetEmailText(userName, resetLink) {
    return `
PC Adviser - Khôi phục mật khẩu

Xin chào ${userName},

Chúng tôi nhận được yêu cầu khôi phục mật khẩu cho tài khoản của bạn. Vui lòng truy cập liên kết sau để đặt lại mật khẩu mới:

${resetLink}

Lưu ý: Liên kết này sẽ hết hạn sau 1 giờ. Nếu bạn không yêu cầu khôi phục mật khẩu, vui lòng bỏ qua email này.

© ${new Date().getFullYear()} PC Adviser. Tất cả quyền được bảo lưu.
    `;
  }
}

module.exports = new EmailClient();

