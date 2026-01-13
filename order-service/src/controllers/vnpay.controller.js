const vnpayService = require("../services/vnpay.service");
const orderService = require("../services/order.service");
const Order = require("../models/order.model");
const {
  PAYMENT_STATUS,
  ORDER_STATUS,
  PAYMENT_METHOD,
} = require("../constants");
const { NotFoundError, ValidationError } = require("../errors");

/**
 * Create VNPay payment URL for an order
 */
const createPaymentUrl = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const { bankCode, locale } = req.body;

    // Find order
    const order = await Order.findById(orderId);
    if (!order) {
      throw new NotFoundError("Order not found");
    }

    // Check if order belongs to user (unless admin)
    if (req.user.role !== "admin" && order.userId.toString() !== req.user.id) {
      throw new ValidationError(
        "You don't have permission to pay for this order"
      );
    }

    // Check if order can be paid
    // Allow payment if:
    // 1. Order is pending payment
    // 2. Payment failed (retry payment)
    // 3. Order is processing but payment method is VNPay and not paid yet (edge case: user changed from COD to VNPay)
    const allowedStatuses = [
      ORDER_STATUS.PENDING_PAYMENT,
      ORDER_STATUS.PAYMENT_FAILED,
    ];

    // Special case: if order is PROCESSING but payment is not paid and method is VNPay
    // This can happen if user updated checkout but hasn't paid yet
    const isProcessingWithUnpaidVnpay =
      order.status === ORDER_STATUS.PROCESSING &&
      order.payment.method === PAYMENT_METHOD.VNPAY &&
      order.payment.status !== PAYMENT_STATUS.PAID;

    if (
      !allowedStatuses.includes(order.status) &&
      !isProcessingWithUnpaidVnpay
    ) {
      throw new ValidationError(
        `Order is not in a payable status. Current status: ${order.status}, Payment status: ${order.payment.status}`
      );
    }

    // Check if payment is already completed
    if (order.payment.status === PAYMENT_STATUS.PAID) {
      throw new ValidationError("Order has already been paid");
    }

    // Get client IP
    const ipAddr =
      req.headers["x-forwarded-for"] ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      req.connection.socket.remoteAddress;

    // Create payment URL
    const paymentUrl = vnpayService.createPaymentUrl({
      orderId: order.orderNumber,
      amount: order.pricing.total,
      orderInfo: `Thanh toan don hang ${order.orderNumber}`,
      ipAddr: ipAddr,
      bankCode: bankCode || null,
      locale: locale || "vn",
    });

    // Update order payment status to processing
    order.payment.status = PAYMENT_STATUS.PROCESSING;
    order.payment.transactionId = order.orderNumber;
    await order.save();

    res.json({
      status: "success",
      message: "Payment URL created successfully",
      data: {
        paymentUrl,
        orderId: order._id,
        orderNumber: order.orderNumber,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Handle VNPay return URL (callback after payment)
 */
const handleReturn = async (req, res, next) => {
  try {
    const vnp_Params = req.query;

    // Verify signature
    if (!vnpayService.verifyReturnUrl(vnp_Params)) {
      return res.status(400).json({
        status: "error",
        message: "Invalid signature",
      });
    }

    const orderId = vnp_Params["vnp_TxnRef"];
    const rspCode = vnp_Params["vnp_ResponseCode"];
    const amount = parseInt(vnp_Params["vnp_Amount"]) / 100;
    const transactionNo = vnp_Params["vnp_TransactionNo"];

    // Find order
    const order = await Order.findOne({
      $or: [{ orderNumber: orderId }, { "payment.transactionId": orderId }],
    });

    if (!order) {
      return res.status(404).json({
        status: "error",
        message: "Order not found",
      });
    }

    // Check amount
    if (order.pricing.total !== amount) {
      return res.status(400).json({
        status: "error",
        message: "Amount mismatch",
      });
    }

    // Update order based on response code
    if (rspCode === "00") {
      // Payment successful
      const wasPaymentPending = order.payment.status === PAYMENT_STATUS.PENDING;
      order.payment.status = PAYMENT_STATUS.PAID;
      order.payment.transactionId = transactionNo || orderId;
      order.payment.paidAt = new Date();
      // After successful payment, order should be confirmed
      order.status = ORDER_STATUS.CONFIRMED;

      await order.save();

      // Note: Customer stats are updated when order is created, not when payment status changes
      // This ensures stats reflect order creation immediately

      // Deduct stock from reserved (convert reserve to deduct)
      try {
        await orderService.deductStockOnPayment(order._id);
      } catch (deductError) {
        console.error("Error deducting stock after payment:", deductError);
        // Log error but don't fail the payment confirmation
      }
    } else {
      // Payment failed
      order.payment.status = PAYMENT_STATUS.FAILED;
      order.status = ORDER_STATUS.PAYMENT_FAILED;
      await order.save();
    }

    // Redirect to frontend with result
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:4001";
    const redirectUrl = `${frontendUrl}/thanh-toan/ket-qua?orderId=${
      order._id
    }&status=${rspCode === "00" ? "success" : "failed"}&orderNumber=${
      order.orderNumber
    }${transactionNo ? `&transactionNo=${transactionNo}` : ""}`;

    res.redirect(redirectUrl);
  } catch (error) {
    next(error);
  }
};

/**
 * Handle VNPay IPN (Instant Payment Notification)
 */
const handleIPN = async (req, res, next) => {
  try {
    const vnp_Params = req.query;

    const result = await vnpayService.handleIPN(vnp_Params);

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Query transaction from VNPay
 */
const queryTransaction = async (req, res, next) => {
  try {
    const { orderId, transDate } = req.body;

    if (!orderId || !transDate) {
      throw new ValidationError("orderId and transDate are required");
    }

    // Get client IP
    const ipAddr =
      req.headers["x-forwarded-for"] ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      req.connection.socket.remoteAddress;

    const result = await vnpayService.queryTransaction({
      orderId,
      transDate,
      ipAddr,
    });

    res.json({
      status: "success",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Refund transaction
 */
const refundTransaction = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const { transDate, amount, transType, user } = req.body;

    // Find order
    const order = await Order.findById(orderId);
    if (!order) {
      throw new NotFoundError("Order not found");
    }

    // Check if order is paid
    if (order.payment.status !== PAYMENT_STATUS.PAID) {
      throw new ValidationError("Order is not paid");
    }

    // Get client IP
    const ipAddr =
      req.headers["x-forwarded-for"] ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      req.connection.socket.remoteAddress;

    const refundAmount = amount || order.pricing.total;

    const result = await vnpayService.refundTransaction({
      orderId: order.orderNumber,
      transDate:
        transDate ||
        order.payment.paidAt.toISOString().replace(/[-:T]/g, "").split(".")[0],
      amount: refundAmount,
      transType: transType || "03",
      user: user || req.user.id,
      ipAddr,
    });

    // Update order if refund successful
    if (result.RspCode === "00") {
      order.payment.status = PAYMENT_STATUS.REFUNDED;
      order.payment.refundedAt = new Date();
      order.payment.refundAmount = refundAmount;
      order.status = ORDER_STATUS.REFUNDED;
      await order.save();
    }

    res.json({
      status: "success",
      message: "Refund processed",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get payment information by order ID
 */
const getPaymentByOrderId = async (req, res, next) => {
  try {
    const { orderId } = req.params;

    // Find order
    const order = await Order.findById(orderId);
    if (!order) {
      throw new NotFoundError("Order not found");
    }

    // Check permission: user can only view their own orders, admin can view all
    if (req.user.role !== "admin" && order.userId.toString() !== req.user.id) {
      throw new ValidationError(
        "You don't have permission to view this order's payment information"
      );
    }

    // Return payment information
    res.json({
      status: "success",
      data: {
        orderId: order._id,
        orderNumber: order.orderNumber,
        payment: order.payment,
        pricing: order.pricing,
        status: order.status,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createPaymentUrl,
  handleReturn,
  handleIPN,
  queryTransaction,
  refundTransaction,
  getPaymentByOrderId,
};
