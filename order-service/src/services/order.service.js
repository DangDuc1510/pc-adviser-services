const Order = require("../models/order.model");
const productClient = require("./product-client");
const identityClient = require("./identity-client");
const promoCodeClient = require("./promoCode-client");
const {
  ORDER_STATUS,
  PAYMENT_STATUS,
  PAYMENT_METHOD,
  VALID_STATUS_TRANSITIONS,
} = require("../constants");
const {
  ValidationError,
  NotFoundError,
  InsufficientStockError,
} = require("../errors");

class OrderService {
  /**
   * Calculate checkout information without creating order
   */
  async calculateCheckout(userId, productIds, couponCode = null) {
    if (!userId) {
      throw new ValidationError("User ID là bắt buộc");
    }

    if (!productIds || productIds.length === 0) {
      throw new ValidationError("Danh sách sản phẩm không được để trống");
    }

    // Get user info
    const user = await identityClient.getUserById(userId);
    if (!user) {
      throw new NotFoundError("Không tìm thấy người dùng");
    }

    // Get products and validate
    const products = [];
    let subtotal = 0;

    for (const item of productIds) {
      const { productId, quantity } = item;

      if (!productId || !quantity || quantity < 1) {
        throw new ValidationError("Thông tin sản phẩm không hợp lệ");
      }

      const product = await productClient.getProductById(productId);
      if (!product) {
        throw new NotFoundError(`Không tìm thấy sản phẩm: ${productId}`);
      }

      // Check stock
      const stockCheck = await productClient.checkStock(productId, quantity);
      if (!stockCheck.available) {
        throw new InsufficientStockError(
          `Sản phẩm ${product.name}: ${stockCheck.reason}`
        );
      }

      const price =
        product.pricing?.salePrice || product.pricing?.originalPrice || 0;
      const itemSubtotal = price * quantity;

      products.push({
        productId: product._id,
        name: product.name,
        slug: product.slug,
        image: product.images?.[0]?.url || null,
        price,
        quantity,
        subtotal: itemSubtotal,
      });

      subtotal += itemSubtotal;
    }

    // Apply coupon if provided
    let discount = 0;
    let coupon = null;

    if (couponCode) {
      try {
        // Get full product info for coupon validation
        const productIds = products.map((item) => item.productId);
        const fullProducts = await productClient.getProductsByIds(productIds);
        const productMap = new Map(
          fullProducts.map((p) => [p._id.toString(), p])
        );

        const cartItemsForCoupon = products.map((item) => {
          const product = productMap.get(item.productId.toString());
          return {
            productId: item.productId,
            quantity: item.quantity,
            categoryId: product?.categoryId,
            brandId: product?.brandId,
          };
        });
console.log("cartItemsForCoupon", cartItemsForCoupon);
        const couponResult = await promoCodeClient.validateAndApplyPromoCode(
          couponCode,
          userId,
          cartItemsForCoupon,
          subtotal
        );
        discount = couponResult.discount;
        coupon = {
          code: couponResult.code,
          name: couponResult.name,
          discountType: couponResult.discountType,
          discountValue: couponResult.discountValue,
          discount: discount,
        };
      } catch (error) {
        throw new ValidationError(`Mã giảm giá không hợp lệ: ${error.message}`);
      }
    }

    // Shipping cost = 0 (free shipping)
    const shippingCost = 0;
    const finalTotal = Math.max(0, subtotal - discount + shippingCost);

    // Auto-fill shipping info from user profile
    const shippingInfo = {
      name: user.userName || user.email || "Khách hàng",
      phone: user.phone || "",
      address: user.address || "",
    };

    return {
      products,
      subtotal,
      discount,
      coupon: coupon ? coupon.code : null,
      shippingCost,
      finalTotal,
      userInfo: {
        name: user.userName || user.email || "Khách hàng",
        phone: user.phone || "",
        address: user.address || "",
      },
      shippingInfo,
    };
  }

  /**
   * Create order and reserve stock
   */
  async createOrder(userId, orderData) {
    const { products, couponCode, shippingInfo, paymentMethod, customerNote } =
      orderData;

    if (!userId) {
      throw new ValidationError("User ID là bắt buộc");
    }

    if (!products || products.length === 0) {
      throw new ValidationError("Danh sách sản phẩm không được để trống");
    }

    if (
      !shippingInfo ||
      !shippingInfo.name ||
      !shippingInfo.phone ||
      !shippingInfo.address
    ) {
      throw new ValidationError("Thông tin giao hàng không đầy đủ");
    }

    // Validate and get products
    const productItems = [];
    let subtotal = 0;

    for (const item of products) {
      const { productId, quantity } = item;

      if (!productId || !quantity || quantity < 1) {
        throw new ValidationError("Thông tin sản phẩm không hợp lệ");
      }

      // Check stock before reserving
      const stockCheck = await productClient.checkStock(productId, quantity);
      if (!stockCheck.available) {
        throw new InsufficientStockError(
          `Sản phẩm không đủ hàng: ${stockCheck.reason}`
        );
      }

      const product = await productClient.getProductById(productId);
      if (!product) {
        throw new NotFoundError(`Không tìm thấy sản phẩm: ${productId}`);
      }

      const price =
        product.pricing?.salePrice || product.pricing?.originalPrice || 0;
      const itemSubtotal = price * quantity;

      productItems.push({
        productId: product._id,
        name: product.name,
        slug: product.slug,
        image: product.images?.[0]?.url || null,
        price,
        quantity,
        subtotal: itemSubtotal,
      });

      subtotal += itemSubtotal;
    }

    // Apply coupon if provided
    let discount = 0;
    let coupon = null;

    if (couponCode) {
      try {
        // Get full product info for coupon validation
        const productIds = productItems.map((item) => item.productId);
        const fullProducts = await productClient.getProductsByIds(productIds);
        const productMap = new Map(
          fullProducts.map((p) => [p._id.toString(), p])
        );

        const cartItemsForCoupon = productItems.map((item) => {
          const product = productMap.get(item.productId.toString());
          return {
            productId: item.productId,
            quantity: item.quantity,
            categoryId: product?.categoryId,
            brandId: product?.brandId,
          };
        });

        const couponResult = await promoCodeClient.validateAndApplyPromoCode(
          couponCode,
          userId,
          cartItemsForCoupon,
          subtotal
        );
        discount = couponResult.discount;
        coupon = {
          code: couponResult.code,
          name: couponResult.name,
          discountType: couponResult.discountType,
          discountValue: couponResult.discountValue,
          discount: discount,
        };
      } catch (error) {
        throw new ValidationError(`Mã giảm giá không hợp lệ: ${error.message}`);
      }
    }

    // Shipping cost = 0 (free shipping)
    const shippingCost = 0;
    const finalTotal = Math.max(0, subtotal - discount + shippingCost);

    // Reserve stock for all products
    try {
      await Promise.all(
        productItems.map((item) =>
          productClient.reserveStock(item.productId, item.quantity)
        )
      );
    } catch (error) {
      throw new InsufficientStockError(
        `Không thể đặt trước hàng: ${error.message}`
      );
    }

    // Determine order status based on payment method
    const status =
      paymentMethod === PAYMENT_METHOD.VNPAY
        ? ORDER_STATUS.PENDING_PAYMENT
        : ORDER_STATUS.PENDING;

    // Generate order number
    const count = await Order.countDocuments();
    const timestamp = Date.now().toString().slice(-8);
    const orderNumber = `ORD${timestamp}${String(count + 1).padStart(4, "0")}`;

    // Create order
    const order = new Order({
      orderNumber,
      userId,
      products: productItems,
      pricing: {
        subtotal,
        discount,
        shippingCost,
        total: finalTotal,
      },
      coupon,
      shippingInfo,
      customerNote,
      payment: {
        method: paymentMethod || PAYMENT_METHOD.VNPAY,
        status: PAYMENT_STATUS.PENDING,
      },
      status,
    });

    await order.save();

    // Update customer stats when order is created
    // This tracks order creation immediately, will be adjusted if order is cancelled
    try {
      await identityClient.updateCustomerStats(
        userId.toString(),
        1, // increment totalOrders by 1
        finalTotal // increment totalSpent by order total
      );
    } catch (error) {
      console.error("Error updating customer stats on order creation:", error.message);
      // Don't throw - order creation should succeed even if stats update fails
    }

    // Record coupon usage
    if (coupon) {
      try {
        await promoCodeClient.recordUsage(coupon.code, discount);
      } catch (error) {
        console.error("Error recording coupon usage:", error);
      }
    }

    // Trigger voucher for order placed (async, don't wait)
    try {
      const axios = require('axios');
      const config = require('../config/env');
      const voucherServiceUrl = config.VOUCHER_SERVICE_URL;
      axios.post(`${voucherServiceUrl}/voucher-triggers/order-placed`, {
        userId: userId.toString(),
        orderId: order._id.toString()
      }).catch(err => {
        console.error('Error triggering voucher for order placed:', err.message);
      });
    } catch (error) {
      console.error('Error calling voucher trigger:', error.message);
    }

    return {
      orderId: order._id,
      orderNumber: order.orderNumber,
      status: order.status,
      order,
    };
  }

  /**
   * Update order (only if not shipped/completed/cancelled)
   */
  async updateOrder(orderId, userId, updateData) {
    const { shippingInfo, paymentMethod, customerNote } = updateData;

    const order = await Order.findById(orderId);
    if (!order) {
      throw new NotFoundError("Không tìm thấy đơn hàng");
    }

    // Check ownership
    if (order.userId.toString() !== userId.toString()) {
      throw new ValidationError("Bạn không có quyền cập nhật đơn hàng này");
    }

    // Check if order can be updated
    const nonUpdatableStatuses = [
      ORDER_STATUS.SHIPPED,
      ORDER_STATUS.COMPLETED,
      ORDER_STATUS.CANCELLED,
    ];

    if (nonUpdatableStatuses.includes(order.status)) {
      throw new ValidationError(
        `Không thể cập nhật đơn hàng ở trạng thái: ${order.status}`
      );
    }

    // Update shipping info
    if (shippingInfo) {
      if (!shippingInfo.name || !shippingInfo.phone || !shippingInfo.address) {
        throw new ValidationError("Thông tin giao hàng không đầy đủ");
      }
      order.shippingInfo = shippingInfo;
    }

    // Update payment method
    if (paymentMethod) {
      order.payment.method = paymentMethod;

      // Update status based on payment method
      if (
        paymentMethod === PAYMENT_METHOD.VNPAY &&
        order.status === ORDER_STATUS.PENDING
      ) {
        order.status = ORDER_STATUS.PENDING_PAYMENT;
      } else if (
        paymentMethod === PAYMENT_METHOD.COD &&
        order.status === ORDER_STATUS.PENDING_PAYMENT
      ) {
        order.status = ORDER_STATUS.PENDING;
      }
    }

    // Update customer note
    if (customerNote !== undefined) {
      order.customerNote = customerNote;
    }

    await order.save();

    return order;
  }

  /**
   * Get orders for a user
   * If userId is null, returns all orders (admin/manager/sales only)
   */
  async getOrders(userId, filters = {}) {
    const { status, paymentStatus, limit = 50, skip = 0 } = filters;

    const query = {};

    // If userId is provided, filter by userId
    if (userId) {
      // Convert userId to ObjectId if it's a string
      const mongoose = require("mongoose");
      const userIdObjectId = mongoose.Types.ObjectId.isValid(userId)
        ? new mongoose.Types.ObjectId(userId)
        : userId;
      query.userId = userIdObjectId;
    }
    // If userId is null, query will match all orders (for admin/manager/sales)

    if (status) {
      query.status = status;
    }

    if (paymentStatus) {
      query["payment.status"] = paymentStatus;
    }

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const total = await Order.countDocuments(query);

    return {
      orders,
      total,
      limit: parseInt(limit),
      skip: parseInt(skip),
    };
  }

  /**
   * Get order by ID
   * @param {string} orderId - Order ID
   * @param {string} userId - User ID (optional, for ownership check)
   * @param {boolean} canViewAllOrders - If true, skip ownership check (admin/manager/sales)
   */
  async getOrderById(orderId, userId = null, canViewAllOrders = false) {
    const order = await Order.findById(orderId);
    if (!order) {
      throw new NotFoundError("Không tìm thấy đơn hàng");
    }

    // Skip ownership check if user can view all orders (admin/manager/sales)
    if (canViewAllOrders) {
      return order;
    }

    // Check ownership if userId provided
    if (userId && order.userId.toString() !== userId.toString()) {
      throw new ValidationError("Bạn không có quyền xem đơn hàng này");
    }

    return order;
  }

  /**
   * Update order status (admin only)
   */
  async updateOrderStatus(orderId, newStatus, note = "") {
    const order = await Order.findById(orderId);
    if (!order) {
      throw new NotFoundError("Không tìm thấy đơn hàng");
    }

    // Validate status transition
    const currentStatus = order.status;
    const validTransitions = VALID_STATUS_TRANSITIONS[currentStatus] || [];

    if (!validTransitions.includes(newStatus)) {
      throw new ValidationError(
        `Không thể chuyển từ trạng thái "${currentStatus}" sang "${newStatus}". Các trạng thái hợp lệ: ${validTransitions.join(
          ", "
        )}`
      );
    }

    // Update status
    const oldStatus = order.status;
    order.status = newStatus;

    // Add status history
    if (!order.statusHistory) {
      order.statusHistory = [];
    }
    order.statusHistory.push({
      status: newStatus,
      updatedAt: new Date(),
      note: note || undefined,
    });

    // Handle special status changes
    if (newStatus === ORDER_STATUS.CANCELLED) {
      // Release reserved stock when order is cancelled
      try {
        await Promise.all(
          order.products.map((item) =>
            productClient.releaseStock(item.productId, item.quantity)
          )
        );
      } catch (error) {
        console.error("Error releasing stock:", error);
        // Don't throw, just log the error
      }

      // Set cancellation info
      if (!order.cancellation) {
        order.cancellation = {};
      }
      order.cancellation.cancelledAt = new Date();
      order.cancellation.reason = note || "Được hủy bởi admin";

      // Decrement customer stats when order is cancelled
      // (because stats were incremented when order was created)
      try {
        await identityClient.updateCustomerStats(
          order.userId.toString(),
          -1, // decrement totalOrders by 1
          -order.pricing.total // decrement totalSpent by order total
        );
      } catch (error) {
        console.error("Error updating customer stats on order cancellation:", error.message);
        // Don't throw - order cancellation should succeed even if stats update fails
      }
    }

    // Update payment status based on order status and payment method
    const wasPaymentPending = order.payment.status === PAYMENT_STATUS.PENDING;

    // VNPay: Mark as paid when order is confirmed (payment already done)
    if (
      newStatus === ORDER_STATUS.CONFIRMED &&
      order.payment.status === PAYMENT_STATUS.PENDING &&
      order.payment.method === PAYMENT_METHOD.VNPAY
    ) {
      order.payment.status = PAYMENT_STATUS.PAID;
      order.payment.paidAt = new Date();
    }

    // COD: Mark as paid only when order is delivered or completed (payment on delivery)
    if (
      (newStatus === ORDER_STATUS.DELIVERED ||
        newStatus === ORDER_STATUS.COMPLETED) &&
      order.payment.status === PAYMENT_STATUS.PENDING &&
      order.payment.method === PAYMENT_METHOD.COD
    ) {
      order.payment.status = PAYMENT_STATUS.PAID;
      order.payment.paidAt = new Date();
    }

    await order.save();

    // Note: Customer stats are updated when order is created, not when payment status changes
    // This ensures stats reflect order creation immediately
    // If order is cancelled, stats are decremented in the cancellation handler above

    return order;
  }

  /**
   * Get order statistics (admin only)
   */
  async getStats() {
    const totalOrders = await Order.countDocuments();

    const pendingOrders = await Order.countDocuments({
      status: ORDER_STATUS.PENDING,
    });

    const confirmedOrders = await Order.countDocuments({
      status: ORDER_STATUS.CONFIRMED,
    });

    const completedOrders = await Order.countDocuments({
      status: ORDER_STATUS.COMPLETED,
    });

    // Calculate total revenue from completed orders or paid orders
    const revenueOrders = await Order.find({
      $or: [
        { status: ORDER_STATUS.COMPLETED },
        { "payment.status": PAYMENT_STATUS.PAID },
      ],
    });

    const totalRevenue = revenueOrders.reduce((sum, order) => {
      return sum + (order.pricing?.total || 0);
    }, 0);

    return {
      totalOrders,
      pendingOrders,
      confirmedOrders,
      completedOrders,
      totalRevenue,
    };
  }

  /**
   * Deduct stock when payment is successful
   */
  async deductStockOnPayment(orderId) {
    const order = await Order.findById(orderId);
    if (!order) {
      throw new NotFoundError("Không tìm thấy đơn hàng");
    }

    // Deduct stock for all products
    try {
      await Promise.all(
        order.products.map((item) =>
          productClient.deductStock(item.productId, item.quantity)
        )
      );
    } catch (error) {
      console.error("Error deducting stock:", error);
      throw new Error(`Không thể trừ hàng: ${error.message}`);
    }
  }
}

module.exports = new OrderService();
