const PromoCode = require("../models/promoCode.model");
const identityClient = require("../clients/identity.client");
const productClient = require("../clients/product.client");

class PromoCodeRepository {
  // Helper method to populate product information using product-client
  async _populateProductInfo(productId) {
    if (!productId) return null;
    try {
      const product = await productClient.getProductById(productId.toString());
      return product
        ? {
            _id: product._id || productId,
            name: product.name,
            sku: product.sku,
          }
        : null;
    } catch (error) {
      console.error(`Error fetching product ${productId}:`, error.message);
      return null;
    }
  }

  // Helper method to populate multiple products
  async _populateProducts(productIds) {
    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return [];
    }
    const uniqueProductIds = [
      ...new Set(productIds.map((id) => id.toString())),
    ];
    try {
      const products = await productClient.getProductsByIds(uniqueProductIds);
      return products.map((product) => ({
        _id: product._id,
        name: product.name,
        sku: product.sku,
      }));
    } catch (error) {
      console.error("Error fetching multiple products:", error.message);
      return [];
    }
  }

  // Helper method to populate brand information using product-client
  async _populateBrandInfo(brandId) {
    if (!brandId) return null;
    try {
      const brand = await productClient.getBrandById(brandId.toString());
      return brand
        ? {
            _id: brand._id || brandId,
            name: brand.name,
          }
        : null;
    } catch (error) {
      console.error(`Error fetching brand ${brandId}:`, error.message);
      return null;
    }
  }

  // Helper method to populate multiple brands
  async _populateBrands(brandIds) {
    if (!brandIds || !Array.isArray(brandIds) || brandIds.length === 0) {
      return [];
    }
    const uniqueBrandIds = [...new Set(brandIds.map((id) => id.toString()))];
    try {
      const brands = await productClient.getBrandsByIds(uniqueBrandIds);
      return brands.map((brand) => ({
        _id: brand._id,
        name: brand.name,
      }));
    } catch (error) {
      console.error("Error fetching multiple brands:", error.message);
      return [];
    }
  }

  // Helper method to populate category information using product-client
  async _populateCategoryInfo(categoryId) {
    if (!categoryId) return null;
    try {
      const category = await productClient.getCategoryById(
        categoryId.toString()
      );
      return category
        ? {
            _id: category._id || categoryId,
            name: category.name,
          }
        : null;
    } catch (error) {
      console.error(`Error fetching category ${categoryId}:`, error.message);
      return null;
    }
  }

  // Helper method to populate multiple categories
  async _populateCategories(categoryIds) {
    if (
      !categoryIds ||
      !Array.isArray(categoryIds) ||
      categoryIds.length === 0
    ) {
      return [];
    }
    const uniqueCategoryIds = [
      ...new Set(categoryIds.map((id) => id.toString())),
    ];
    try {
      const categories = await productClient.getCategoriesByIds(
        uniqueCategoryIds
      );
      return categories.map((category) => ({
        _id: category._id,
        name: category.name,
      }));
    } catch (error) {
      console.error("Error fetching multiple categories:", error.message);
      return [];
    }
  }

  // Helper method to populate user information using identity-client
  async _populateUserInfo(userId) {
    if (!userId) return null;
    try {
      const user = await identityClient.getUserById(userId.toString());
      return user
        ? {
            _id: user._id || userId,
            userName: user.userName,
            email: user.email,
          }
        : null;
    } catch (error) {
      console.error(`Error fetching user ${userId}:`, error.message);
      return null;
    }
  }

  // Helper method to populate multiple users
  async _populateUsers(userIds) {
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return [];
    }
    const uniqueUserIds = [...new Set(userIds.map((id) => id.toString()))];
    const users = await Promise.all(
      uniqueUserIds.map((id) => this._populateUserInfo(id))
    );
    return users.filter(Boolean);
  }
  // Find promo code by ID
  async findById(promoCodeId) {
    const promoCode = await PromoCode.findById(promoCodeId);

    if (!promoCode) return null;

    // Populate product, category, brand and user information using clients
    const [productIds, categoryIds, brandIds, userIds, createdBy, updatedBy] =
      await Promise.all([
        this._populateProducts(promoCode.productIds || []),
        this._populateCategories(promoCode.categoryIds || []),
        this._populateBrands(promoCode.brandIds || []),
        this._populateUsers(promoCode.userIds || []),
        this._populateUserInfo(promoCode.createdBy),
        this._populateUserInfo(promoCode.updatedBy),
      ]);

    const result = promoCode.toObject ? promoCode.toObject() : promoCode;
    result.productIds = productIds;
    result.categoryIds = categoryIds;
    result.brandIds = brandIds;
    result.userIds = userIds;
    result.createdBy = createdBy;
    result.updatedBy = updatedBy;

    return result;
  }

  // Find promo code by code
  async findByCode(code, populateData = true) {
    if (!code || typeof code !== "string") {
      return null;
    }
    const promoCode = await PromoCode.findOne({
      code: code.toUpperCase().trim(),
    });

    if (!promoCode) return null;

    // If populateData is false, return Mongoose document directly (preserves methods like calculateDiscount)
    if (!populateData) {
      return promoCode;
    }

    // Populate product, category, brand and user information using clients
    const [productIds, categoryIds, brandIds, userIds] = await Promise.all([
      this._populateProducts(promoCode.productIds || []),
      this._populateCategories(promoCode.categoryIds || []),
      this._populateBrands(promoCode.brandIds || []),
      this._populateUsers(promoCode.userIds || []),
    ]);

    const result = promoCode.toObject ? promoCode.toObject() : promoCode;
    result.productIds = productIds;
    result.categoryIds = categoryIds;
    result.brandIds = brandIds;
    result.userIds = userIds;

    return result;
  }

  // Find all promo codes with filters and pagination
  async findAll(filters = {}, options = {}) {
    const { page = 1, limit = 20, sort = { createdAt: -1 } } = options;

    const query = {};

    // Apply filters
    if (filters.type) query.type = filters.type;
    if (filters.isActive !== undefined) query.isActive = filters.isActive;
    if (filters.code) query.code = new RegExp(filters.code.toUpperCase(), "i");
    if (filters.name) query.name = new RegExp(filters.name, "i");

    // Date range filter
    if (filters.startDate || filters.endDate) {
      query.$or = [];
      if (filters.startDate) {
        query.$or.push({ startDate: { $gte: new Date(filters.startDate) } });
      }
      if (filters.endDate) {
        query.$or.push({ endDate: { $lte: new Date(filters.endDate) } });
      }
    }

    // User-specific filter
    if (filters.userId) {
      query.userIds = filters.userId;
    }

    const skip = (page - 1) * limit;

    const [promoCodes, total] = await Promise.all([
      PromoCode.find(query).sort(sort).skip(skip).limit(limit),
      PromoCode.countDocuments(query),
    ]);

    // Populate product, category, brand and user information using clients for all promoCodes
    const promoCodesWithPopulated = await Promise.all(
      promoCodes.map(async (promoCode) => {
        const [
          productIds,
          categoryIds,
          brandIds,
          userIds,
          createdBy,
          updatedBy,
        ] = await Promise.all([
          this._populateProducts(promoCode.productIds || []),
          this._populateCategories(promoCode.categoryIds || []),
          this._populateBrands(promoCode.brandIds || []),
          this._populateUsers(promoCode.userIds || []),
          this._populateUserInfo(promoCode.createdBy),
          this._populateUserInfo(promoCode.updatedBy),
        ]);

        const result = promoCode.toObject ? promoCode.toObject() : promoCode;
        result.productIds = productIds;
        result.categoryIds = categoryIds;
        result.brandIds = brandIds;
        result.userIds = userIds;
        result.createdBy = createdBy;
        result.updatedBy = updatedBy;

        return result;
      })
    );

    return {
      promoCodes: promoCodesWithPopulated,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  // Find valid promo codes for a user
  async findValidForUser(userId, options = {}) {
    const { minAmount = 0 } = options;
    const now = new Date();

    // Build type filter: public or user-specific for this user
    const typeFilter = [{ type: "public" }];
    if (userId) {
      typeFilter.push({ type: "user-specific", userIds: userId });
    }

    const query = {
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now },
      $and: [
        // Type filter: public or user-specific for this user
        {
          $or: typeFilter,
        },
        // Usage limit filter: no limit or not exceeded
        {
          $or: [
            { usageLimit: { $exists: false } },
            { $expr: { $lt: ["$usageCount", "$usageLimit"] } },
          ],
        },
      ],
    };

    // Only filter by minPurchaseAmount if minAmount is provided and > 0
    // This ensures we show all valid vouchers when minAmount is 0 or not provided
    if (minAmount > 0) {
      query.minPurchaseAmount = { $lte: minAmount };
    }

    const promoCodes = await PromoCode.find(query).sort({ createdAt: -1 });

    // Populate product, category and brand information using product-client
    const promoCodesWithPopulated = await Promise.all(
      promoCodes.map(async (promoCode) => {
        const [productIds, categoryIds, brandIds] = await Promise.all([
          this._populateProducts(promoCode.productIds || []),
          this._populateCategories(promoCode.categoryIds || []),
          this._populateBrands(promoCode.brandIds || []),
        ]);

        const result = promoCode.toObject ? promoCode.toObject() : promoCode;
        result.productIds = productIds;
        result.categoryIds = categoryIds;
        result.brandIds = brandIds;

        return result;
      })
    );

    return promoCodesWithPopulated;
  }

  // Create new promo code
  async create(promoCodeData) {
    // Ensure code is uppercase
    if (promoCodeData.code) {
      promoCodeData.code = promoCodeData.code.toUpperCase().trim();
    }

    const promoCode = new PromoCode(promoCodeData);
    return await promoCode.save();
  }

  // Update promo code
  async update(promoCodeId, updateData) {
    // Ensure code is uppercase if being updated
    if (updateData.code) {
      updateData.code = updateData.code.toUpperCase().trim();
    }

    const promoCode = await PromoCode.findByIdAndUpdate(
      promoCodeId,
      updateData,
      { new: true, runValidators: true }
    );

    if (!promoCode) return null;

    // Populate product, category, brand and user information using clients
    const [productIds, categoryIds, brandIds, userIds] = await Promise.all([
      this._populateProducts(promoCode.productIds || []),
      this._populateCategories(promoCode.categoryIds || []),
      this._populateBrands(promoCode.brandIds || []),
      this._populateUsers(promoCode.userIds || []),
    ]);

    const result = promoCode.toObject ? promoCode.toObject() : promoCode;
    result.productIds = productIds;
    result.categoryIds = categoryIds;
    result.brandIds = brandIds;
    result.userIds = userIds;

    return result;
  }

  // Increment usage count
  async incrementUsage(promoCodeId, discountAmount = 0) {
    return await PromoCode.findByIdAndUpdate(
      promoCodeId,
      {
        $inc: {
          usageCount: 1,
          totalDiscountGiven: discountAmount,
          totalOrders: 1,
        },
      },
      { new: true }
    );
  }

  // Toggle active status
  async toggleActive(promoCodeId) {
    const promoCode = await PromoCode.findById(promoCodeId);
    if (!promoCode) return null;

    promoCode.isActive = !promoCode.isActive;
    return await promoCode.save();
  }

  // Delete promo code
  async delete(promoCodeId) {
    return await PromoCode.findByIdAndDelete(promoCodeId);
  }

  // Get promo code statistics
  async getStats(filters = {}) {
    const matchStage = {};

    if (filters.startDate || filters.endDate) {
      matchStage.createdAt = {};
      if (filters.startDate)
        matchStage.createdAt.$gte = new Date(filters.startDate);
      if (filters.endDate)
        matchStage.createdAt.$lte = new Date(filters.endDate);
    }

    const stats = await PromoCode.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalPromoCodes: { $sum: 1 },
          activePromoCodes: {
            $sum: { $cond: ["$isActive", 1, 0] },
          },
          totalUsage: { $sum: "$usageCount" },
          totalDiscountGiven: { $sum: "$totalDiscountGiven" },
          totalOrders: { $sum: "$totalOrders" },
          publicCodes: {
            $sum: { $cond: [{ $eq: ["$type", "public"] }, 1, 0] },
          },
          userSpecificCodes: {
            $sum: { $cond: [{ $eq: ["$type", "user-specific"] }, 1, 0] },
          },
          internalCodes: {
            $sum: { $cond: [{ $eq: ["$type", "internal"] }, 1, 0] },
          },
        },
      },
    ]);

    return (
      stats[0] || {
        totalPromoCodes: 0,
        activePromoCodes: 0,
        totalUsage: 0,
        totalDiscountGiven: 0,
        totalOrders: 0,
        publicCodes: 0,
        userSpecificCodes: 0,
        internalCodes: 0,
      }
    );
  }
}

module.exports = new PromoCodeRepository();
