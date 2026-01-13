const promoCodeRepository = require("../repositories/promoCode.repository");
const { ValidationError, NotFoundError } = require("../errors");

class PromoCodeService {
  // Get all promo codes with filters
  async getAllPromoCodes(filters = {}, options = {}) {
    return await promoCodeRepository.findAll(filters, options);
  }

  // Get promo code by ID
  async getPromoCodeById(promoCodeId) {
    const promoCode = await promoCodeRepository.findById(promoCodeId);
    if (!promoCode) {
      throw new NotFoundError("Mã khuyến mãi không tồn tại");
    }
    return promoCode;
  }

  // Get promo code by code
  async getPromoCodeByCode(code) {
    const promoCode = await promoCodeRepository.findByCode(code);
    if (!promoCode) {
      throw new NotFoundError("Mã khuyến mãi không tồn tại");
    }
    return promoCode;
  }

  // Create new promo code
  async createPromoCode(promoCodeData, createdBy) {
    // Check if code already exists
    const existingCode = await promoCodeRepository.findByCode(
      promoCodeData.code
    );
    if (existingCode) {
      throw new ValidationError("Mã khuyến mãi đã tồn tại");
    }

    // Validate dates
    if (promoCodeData.endDate <= promoCodeData.startDate) {
      throw new ValidationError("Ngày kết thúc phải sau ngày bắt đầu");
    }

    // Validate discount value
    if (
      promoCodeData.discountType === "percentage" &&
      promoCodeData.discountValue > 100
    ) {
      throw new ValidationError("Phần trăm giảm giá không được vượt quá 100%");
    }

    // Set createdBy
    promoCodeData.createdBy = createdBy;

    return await promoCodeRepository.create(promoCodeData);
  }

  // Update promo code
  async updatePromoCode(promoCodeId, updateData, updatedBy) {
    const promoCode = await promoCodeRepository.findById(promoCodeId);
    if (!promoCode) {
      throw new NotFoundError("Mã khuyến mãi không tồn tại");
    }

    // Check if code is being changed and if new code exists
    if (updateData.code && updateData.code !== promoCode.code) {
      const existingCode = await promoCodeRepository.findByCode(
        updateData.code
      );
      if (existingCode && existingCode._id.toString() !== promoCodeId) {
        throw new ValidationError("Mã khuyến mãi đã tồn tại");
      }
    }

    // Validate dates if being updated
    const startDate = updateData.startDate || promoCode.startDate;
    const endDate = updateData.endDate || promoCode.endDate;
    if (endDate <= startDate) {
      throw new ValidationError("Ngày kết thúc phải sau ngày bắt đầu");
    }

    // Validate discount value
    const discountValue =
      updateData.discountValue !== undefined
        ? updateData.discountValue
        : promoCode.discountValue;
    const discountType = updateData.discountType || promoCode.discountType;
    if (discountType === "percentage" && discountValue > 100) {
      throw new ValidationError("Phần trăm giảm giá không được vượt quá 100%");
    }

    updateData.updatedBy = updatedBy;
    return await promoCodeRepository.update(promoCodeId, updateData);
  }

  // Validate and apply promo code
  async validateAndApplyPromoCode(
    code,
    userId,
    cartItems = [],
    subtotal = 0,
    isAdmin = false
  ) {
    // Don't populate data when validating - we need Mongoose document to use calculateDiscount method
    const promoCode = await promoCodeRepository.findByCode(code, false);
    console.log("promoCode vao 1", promoCode);
    if (!promoCode) {
      throw new NotFoundError("Mã khuyến mãi không tồn tại");
    }

    if (!promoCode.isActive) {
      throw new ValidationError("Mã khuyến mãi không còn hoạt động");
    }

    const now = new Date();
    if (now < promoCode.startDate) {
      throw new ValidationError("Mã khuyến mãi chưa có hiệu lực");
    }

    if (now > promoCode.endDate) {
      throw new ValidationError("Mã khuyến mãi đã hết hạn");
    }

    // Check usage limit
    if (promoCode.usageLimit && promoCode.usageCount >= promoCode.usageLimit) {
      throw new ValidationError("Mã khuyến mãi đã hết lượt sử dụng");
    }

    // Check user eligibility
    if (promoCode.type === "user-specific") {
      if (
        !userId ||
        !promoCode.userIds.some((id) => id.toString() === userId.toString())
      ) {
        throw new ValidationError(
          "Bạn không có quyền sử dụng mã khuyến mãi này"
        );
      }
    }

    if (promoCode.type === "internal" && !isAdmin) {
      throw new ValidationError("Mã khuyến mãi nội bộ chỉ dành cho nhân viên");
    }

    // Check minimum purchase amount
    if (subtotal < promoCode.minPurchaseAmount) {
      throw new ValidationError(
        `Đơn hàng tối thiểu ${promoCode.minPurchaseAmount.toLocaleString(
          "vi-VN"
        )} VND để sử dụng mã này`
      );
    }

    // Check if applicable to cart items
    if (promoCode.applicableTo !== "all" && cartItems.length > 0) {
      let isApplicable = false;

      if (promoCode.applicableTo === "categories") {
        const cartCategoryIds = cartItems
          .map((item) => item.categoryId?._id?.toString())
          .filter(Boolean);
        isApplicable = promoCode.categoryIds.some((catId) =>
          cartCategoryIds.includes(catId.toString())
        );
        console.log("isApplicable", isApplicable);
      } else if (promoCode.applicableTo === "products") {
        const cartProductIds = cartItems
          .map((item) => item.productId?.toString())
          .filter(Boolean);
        isApplicable = promoCode.productIds.some((prodId) =>
          cartProductIds.includes(prodId.toString())
        );
      } else if (promoCode.applicableTo === "brands") {
        const cartBrandIds = cartItems
          .map((item) => item.brandId?._id?.toString())
          .filter(Boolean);
        isApplicable = promoCode.brandIds.some((brandId) =>
          cartBrandIds.includes(brandId.toString())
        );
      }

      if (!isApplicable) {
        throw new ValidationError(
          "Mã khuyến mãi không áp dụng cho sản phẩm trong giỏ hàng"
        );
      }
    }

    // Calculate discount
    const discount = promoCode.calculateDiscount(subtotal);

    return {
      promoCode,
      discount,
      isValid: true,
    };
  }

  // Get valid promo codes for user
  async getValidPromoCodesForUser(userId, minAmount = 0) {
    return await promoCodeRepository.findValidForUser(userId, { minAmount });
  }

  // Toggle active status
  async toggleActive(promoCodeId) {
    const promoCode = await promoCodeRepository.findById(promoCodeId);
    if (!promoCode) {
      throw new NotFoundError("Mã khuyến mãi không tồn tại");
    }
    return await promoCodeRepository.toggleActive(promoCodeId);
  }

  // Delete promo code
  async deletePromoCode(promoCodeId) {
    const promoCode = await promoCodeRepository.findById(promoCodeId);
    if (!promoCode) {
      throw new NotFoundError("Mã khuyến mãi không tồn tại");
    }
    return await promoCodeRepository.delete(promoCodeId);
  }

  // Get statistics
  async getStats(filters = {}) {
    return await promoCodeRepository.getStats(filters);
  }

  // Record usage (called when order is created)
  async recordUsage(promoCodeId, discountAmount) {
    return await promoCodeRepository.incrementUsage(
      promoCodeId,
      discountAmount
    );
  }
}

module.exports = new PromoCodeService();
