class NotificationService {
  async sendOrderConfirmation(order) {
    if (!order) return;
    try {
      console.log(`[Notification] Order ${order.orderNumber} confirmed for ${order.customer?.email}`);
      // TODO: integrate with email/SMS service.
    } catch (error) {
      console.error('❌ [Notification] Failed to send confirmation:', error.message);
    }
  }

  async sendPaymentSuccess(order) {
    if (!order) return;
    try {
      console.log(`[Notification] Payment received for order ${order.orderNumber}`);
    } catch (error) {
      console.error('❌ [Notification] Failed to send payment success notification:', error.message);
    }
  }

  async sendPaymentFailure(order) {
    if (!order) return;
    try {
      console.log(`[Notification] Payment failed for order ${order.orderNumber}`);
    } catch (error) {
      console.error('❌ [Notification] Failed to send payment failure notification:', error.message);
    }
  }
}

module.exports = new NotificationService();

