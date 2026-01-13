const promoCodeService = require("../services/promoCode.service");

// Get all promo codes
const getAllPromoCodes = async (req, res, next) => {
  try {
    const {
      page,
      limit,
      type,
      isActive,
      code,
      name,
      startDate,
      endDate,
      userId,
      sortBy,
      sortOrder,
    } = req.query;

    const filters = {};
    if (type) filters.type = type;
    if (isActive !== undefined) filters.isActive = isActive === "true";
    if (code) filters.code = code;
    if (name) filters.name = name;
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;
    if (userId) filters.userId = userId;

    const result = await promoCodeService.getAllPromoCodes(filters, {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
      sort: sortBy
        ? { [sortBy]: sortOrder === "asc" ? 1 : -1 }
        : { createdAt: -1 },
    });

    res.json({
      status: "success",
      data: result.promoCodes,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

// Get promo code by ID
const getPromoCodeById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const promoCode = await promoCodeService.getPromoCodeById(id);

    res.json({
      status: "success",
      data: promoCode,
    });
  } catch (error) {
    next(error);
  }
};

// Get promo code by code
const getPromoCodeByCode = async (req, res, next) => {
  try {
    const { code } = req.params;
    const promoCode = await promoCodeService.getPromoCodeByCode(code);

    res.json({
      status: "success",
      data: promoCode,
    });
  } catch (error) {
    next(error);
  }
};

// Create promo code
const createPromoCode = async (req, res, next) => {
  try {
    const createdBy = req.user?.id;
    const promoCode = await promoCodeService.createPromoCode(
      req.body,
      createdBy
    );

    res.status(201).json({
      status: "success",
      message: "Tạo mã khuyến mãi thành công",
      data: promoCode,
    });
  } catch (error) {
    next(error);
  }
};

// Update promo code
const updatePromoCode = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updatedBy = req.user?.id;
    const promoCode = await promoCodeService.updatePromoCode(
      id,
      req.body,
      updatedBy
    );

    res.json({
      status: "success",
      message: "Cập nhật mã khuyến mãi thành công",
      data: promoCode,
    });
  } catch (error) {
    next(error);
  }
};

// Validate promo code (for cart/checkout)
const validatePromoCode = async (req, res, next) => {
  try {
    const { code } = req.body;
    const userId = req.user?.id;
    const { cartItems = [], subtotal = 0 } = req.body;
    const isAdmin = req.user?.role === "admin";

    const result = await promoCodeService.validateAndApplyPromoCode(
      code,
      userId,
      cartItems,
      subtotal,
      isAdmin
    );

    res.json({
      status: "success",
      message: "Mã khuyến mãi hợp lệ",
      data: {
        code: result.promoCode.code,
        name: result.promoCode.name,
        discount: result.discount,
        discountType: result.promoCode.discountType,
        discountValue: result.promoCode.discountValue,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get valid promo codes for user
const getValidPromoCodes = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const { minAmount = 0 } = req.query;

    const promoCodes = await promoCodeService.getValidPromoCodesForUser(
      userId,
      parseFloat(minAmount)
    );

    res.json({
      status: "success",
      data: promoCodes,
    });
  } catch (error) {
    next(error);
  }
};

// Toggle active status
const toggleActive = async (req, res, next) => {
  try {
    const { id } = req.params;
    const promoCode = await promoCodeService.toggleActive(id);

    res.json({
      status: "success",
      message: `Mã khuyến mãi đã ${
        promoCode.isActive ? "kích hoạt" : "ngừng kích hoạt"
      }`,
      data: promoCode,
    });
  } catch (error) {
    next(error);
  }
};

// Delete promo code
const deletePromoCode = async (req, res, next) => {
  try {
    const { id } = req.params;
    await promoCodeService.deletePromoCode(id);

    res.json({
      status: "success",
      message: "Xóa mã khuyến mãi thành công",
    });
  } catch (error) {
    next(error);
  }
};

// Get statistics
const getStats = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const filters = {};
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;

    const stats = await promoCodeService.getStats(filters);

    res.json({
      status: "success",
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};

// Record usage (internal endpoint for service-to-service calls)
const recordUsage = async (req, res, next) => {
  try {
    const { code, discountAmount } = req.body;

    if (!code) {
      return res.status(400).json({
        status: "error",
        message: "Code là bắt buộc",
      });
    }

    const promoCode = await promoCodeService.getPromoCodeByCode(code);
    await promoCodeService.recordUsage(promoCode._id, discountAmount || 0);

    res.json({
      status: "success",
      message: "Đã ghi nhận sử dụng mã khuyến mãi",
    });
  } catch (error) {
    next(error);
  }
};

// Validate and apply promo code (internal endpoint for service-to-service calls)
const validatePromoCodeInternal = async (req, res, next) => {
  try {
    const { code, userId, cartItems = [], subtotal = 0 } = req.body;

    if (!code) {
      return res.status(400).json({
        status: "error",
        message: "Code là bắt buộc",
      });
    }

    const result = await promoCodeService.validateAndApplyPromoCode(
      code,
      userId,
      cartItems,
      subtotal,
      false
    );

    // Convert Mongoose document to plain object
    const promoCodeObj = result.promoCode.toObject
      ? result.promoCode.toObject()
      : result.promoCode;

    // Return format compatible with order-service expectations
    res.json({
      status: "success",
      data: {
        code: promoCodeObj.code,
        name: promoCodeObj.name,
        discountType: promoCodeObj.discountType,
        discountValue: promoCodeObj.discountValue,
        discount: result.discount,
        isValid: result.isValid,
        promoCode: promoCodeObj,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllPromoCodes,
  getPromoCodeById,
  getPromoCodeByCode,
  createPromoCode,
  updatePromoCode,
  validatePromoCode,
  getValidPromoCodes,
  toggleActive,
  deletePromoCode,
  getStats,
  recordUsage,
  validatePromoCodeInternal,
};
