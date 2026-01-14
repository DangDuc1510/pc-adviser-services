const orderService = require("../services/order.service");
const { ValidationError } = require("../errors");

/**
 * POST /orders/checkout
 * Calculate checkout information without creating order
 */
const checkout = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new ValidationError("Người dùng chưa đăng nhập");
    }

    const { productIds, couponCode } = req.body;

    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      throw new ValidationError("Danh sách sản phẩm không được để trống");
    }

    const checkoutData = await orderService.calculateCheckout(
      userId,
      productIds,
      couponCode
    );

    res.json({
      status: "success",
      data: checkoutData,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /orders
 * Create order and reserve stock
 */
const createOrder = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new ValidationError("Người dùng chưa đăng nhập");
    }

    const { products, couponCode, shippingInfo, paymentMethod, customerNote } =
      req.body;

    const result = await orderService.createOrder(userId, {
      products,
      couponCode,
      shippingInfo,
      paymentMethod,
      customerNote,
    });

    res.status(201).json({
      status: "success",
      message: "Tạo đơn hàng thành công",
      data: {
        _id: result.orderId,
        orderNumber: result.orderNumber,
        status: result.status,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /orders/:orderId
 * Update order (only if not shipped/completed/cancelled)
 */
const updateOrder = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new ValidationError("Người dùng chưa đăng nhập");
    }

    const { orderId } = req.params;
    const { shippingInfo, paymentMethod, customerNote } = req.body;

    const order = await orderService.updateOrder(orderId, userId, {
      shippingInfo,
      paymentMethod,
      customerNote,
    });

    res.json({
      status: "success",
      message: "Cập nhật đơn hàng thành công",
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /orders
 * Get list of orders for the authenticated user or for a specific customer (admin/employee only)
 */
const getOrders = async (req, res, next) => {
  try {
    const requestingUserId = req.user?.id;
    if (!requestingUserId) {
      throw new ValidationError("Người dùng chưa đăng nhập");
    }

    // Check if query params contain userId or deviceFingerprint (for admin/employee viewing other customers' orders)
    let targetUserId = req.query.userId;
    const deviceFingerprint = req.query.deviceFingerprint;

    // If deviceFingerprint is provided, find customer to get userId
    let isGuestCustomer = false;
    if (deviceFingerprint && !targetUserId) {
      try {
        const axios = require("axios");
        const config = require("../config/env");
        const identityServiceUrl = config.IDENTITY_SERVICE_URL;

        // Find customer by deviceFingerprint
        const customersResponse = await axios.get(
          `${identityServiceUrl}/customers`,
          {
            headers: {
              Authorization: req.headers.authorization,
              "x-access-token": req.headers["x-access-token"],
            },
            params: {
              deviceFingerprint: deviceFingerprint,
              limit: 1,
            },
          }
        );

        const customers =
          customersResponse.data?.data?.customers ||
          customersResponse.data?.customers ||
          [];
        if (customers.length > 0) {
          if (customers[0].userId) {
            targetUserId = customers[0].userId;
          } else {
            // Guest customer (no userId) - cannot have orders
            isGuestCustomer = true;
          }
        }
      } catch (error) {
        console.error(
          "Error finding customer by deviceFingerprint:",
          error.message
        );
        // Continue with targetUserId = null, will return empty result
      }
    }

    // If guest customer, return empty orders (guest customers cannot have orders)
    if (isGuestCustomer) {
      return res.json({
        status: "success",
        data: {
          orders: [],
          total: 0,
          limit: parseInt(req.query.limit) || 50,
          skip: parseInt(req.query.skip) || 0,
        },
      });
    }

    // Determine which userId to use
    const isAdmin = req.user?.role === "admin";
    const isEmployee = req.user?.role === "employee";
    const canViewAllOrders = isAdmin || isEmployee;

    let userId = null; // null means get all orders (for admin/employee)

    if (targetUserId) {
      // Admin/employee can view other customers' orders
      if (!canViewAllOrders) {
        throw new ValidationError(
          "Bạn không có quyền xem đơn hàng của người khác"
        );
      }
      userId = targetUserId;
    } else if (!canViewAllOrders) {
      // Regular user views their own orders
      userId = requestingUserId;
    }
    // If admin/employee and no targetUserId, userId remains null (get all orders)

    // Convert page to skip if page is provided
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip =
      req.query.skip !== undefined
        ? parseInt(req.query.skip)
        : (page - 1) * limit;

    const filters = {
      status: req.query.status,
      paymentStatus: req.query.paymentStatus,
      limit: limit,
      skip: skip,
    };

    const result = await orderService.getOrders(userId, filters);

    res.json({
      status: "success",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /orders/internal/user/:userId
 * Get orders by userId (internal endpoint, no auth required)
 */
const getOrdersByUserIdInternal = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { limit = 1000, skip = 0, status, paymentStatus } = req.query;

    if (!userId) {
      return res.status(400).json({
        status: "fail",
        message: "User ID is required",
      });
    }

    const filters = {
      status,
      paymentStatus,
      limit: parseInt(limit),
      skip: parseInt(skip),
    };

    const result = await orderService.getOrders(userId, filters);

    res.json({
      status: "success",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /orders/:orderId
 * Get order details
 */
const getOrderById = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;
    const { orderId } = req.params;

    // Admin and employee can view any order
    const canViewAllOrders = userRole === "admin" || userRole === "employee";

    const order = await orderService.getOrderById(
      orderId,
      userId,
      canViewAllOrders
    );

    res.json({
      status: "success",
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /orders/:orderId/status
 * Update order status (admin only)
 */
const updateOrderStatus = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const { status, note } = req.body;

    if (!status) {
      throw new ValidationError("Trạng thái mới là bắt buộc");
    }

    const order = await orderService.updateOrderStatus(orderId, status, note);

    res.json({
      status: "success",
      message: "Cập nhật trạng thái đơn hàng thành công",
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /orders/stats
 * Get order statistics (admin only)
 */
const getStats = async (req, res, next) => {
  try {
    const stats = await orderService.getStats();

    res.json({
      status: "success",
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  checkout,
  createOrder,
  updateOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
  getStats,
  getOrdersByUserIdInternal,
};
