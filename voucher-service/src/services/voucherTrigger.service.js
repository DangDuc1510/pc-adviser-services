const config = require('../config/env');
const voucherRuleRepository = require('../repositories/voucherRule.repository');
const promoCodeService = require('./promoCode.service');
const voucherDistributionRepository = require('../repositories/voucherDistribution.repository');
const { ValidationError, AuthorizationError } = require('../errors');

class VoucherTriggerService {
  /**
   * Handle trigger from external service
   * @param {String} type - Trigger type (user_registered, spending_milestone, birthday, inactivity_days)
   * @param {String} jwtSecret - JWT secret for authentication
   * @param {String} userId - User ID to distribute voucher to
   * @returns {Object} Results of voucher distribution
   */
  async handleTrigger(type, jwtSecret, userId) {
    // 1. Verify JWT_SECRET
    if (jwtSecret !== config.JWT_SECRET) {
      throw new AuthorizationError('JWT_SECRET không hợp lệ');
    }

    // 2. Validate trigger type
    const validTypes = ['user_registered', 'spending_milestone', 'birthday', 'inactivity_days'];
    if (!validTypes.includes(type)) {
      throw new ValidationError(`Trigger type không hợp lệ. Chỉ chấp nhận: ${validTypes.join(', ')}`);
    }

    // 3. Validate userId
    if (!userId) {
      throw new ValidationError('userId là bắt buộc');
    }

    // 4. Find active rules for this trigger type
    const rules = await voucherRuleRepository.findActiveRulesByTriggerType(type);
    
    if (rules.length === 0) {
      return {
        success: true,
        message: `Không có rule nào active cho trigger type: ${type}`,
        distributed: 0,
        results: []
      };
    }

    // 5. Distribute vouchers for each rule
    const results = [];
    let distributedCount = 0;

    for (const rule of rules) {
      try {
        // Check if already distributed for this rule and user
        const VoucherDistribution = require('../models/voucherDistribution.model');
        const existing = await VoucherDistribution.findOne({
          ruleId: rule._id,
          userId: userId,
          triggerType: type
        });

        if (existing) {
          results.push({
            ruleId: rule._id.toString(),
            ruleName: rule.name,
            success: false,
            message: 'Voucher đã được phát cho user này với rule này'
          });
          continue;
        }

        // Create promo code from template
        const promoCode = await this._createPromoCodeFromTemplate(rule.voucherTemplate, userId);

        // Create voucher distribution
        const distribution = await voucherDistributionRepository.create({
          ruleId: rule._id,
          userId: userId,
          promoCodeId: promoCode._id || promoCode.id,
          triggerType: type,
          triggerData: this._buildTriggerData(type, rule),
          distributedAt: new Date(),
          status: 'pending'
        });

        distributedCount++;
        results.push({
          ruleId: rule._id.toString(),
          ruleName: rule.name,
          success: true,
          promoCodeId: promoCode._id?.toString() || promoCode.id?.toString(),
          promoCode: promoCode.code,
          distributionId: distribution._id?.toString() || distribution.id?.toString()
        });
      } catch (error) {
        results.push({
          ruleId: rule._id.toString(),
          ruleName: rule.name,
          success: false,
          error: error.message
        });
      }
    }

    return {
      success: true,
      message: `Đã phát ${distributedCount} voucher cho user ${userId}`,
      distributed: distributedCount,
      total: rules.length,
      results
    };
  }

  /**
   * Create promo code from voucher template
   * @private
   */
  async _createPromoCodeFromTemplate(template, userId) {
    // Generate unique code
    const code = await this._generateUniqueCode(template.name);

    // Calculate dates
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + template.validityDays);

    const promoCodeData = {
      code,
      name: template.name,
      description: template.description,
      type: 'user-specific',
      userIds: [userId],
      discountType: template.discountType,
      discountValue: template.discountValue,
      maxDiscountAmount: template.maxDiscountAmount,
      minPurchaseAmount: template.minPurchaseAmount,
      startDate,
      endDate,
      usageLimitPerUser: template.usageLimitPerUser,
      applicableTo: template.applicableTo || 'all',
      categoryIds: template.categoryIds || [],
      productIds: template.productIds || [],
      brandIds: template.brandIds || [],
      isActive: true
    };

    return await promoCodeService.createPromoCode(promoCodeData, null);
  }

  /**
   * Generate unique promo code
   * @private
   */
  async _generateUniqueCode(baseName) {
    const PromoCode = require('../models/promoCode.model');
    const prefix = baseName.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, '') || 'VCH';
    let code = `${prefix}${Date.now().toString().slice(-6)}`;
    let counter = 1;

    while (await PromoCode.findOne({ code })) {
      code = `${prefix}${Date.now().toString().slice(-6)}${counter}`;
      counter++;
      if (counter > 100) {
        throw new Error('Không thể tạo mã voucher duy nhất');
      }
    }

    return code;
  }

  /**
   * Build trigger data based on type
   * @private
   */
  _buildTriggerData(type, rule) {
    const triggerData = {};

    switch (type) {
      case 'user_registered':
        triggerData.registeredAt = new Date();
        break;
      case 'spending_milestone':
        triggerData.amount = rule.triggerConfig?.amount || 20000000;
        break;
      case 'birthday':
        triggerData.date = new Date();
        break;
      case 'inactivity_days':
        triggerData.days = rule.triggerConfig?.days || 30;
        break;
    }

    return triggerData;
  }
}

module.exports = new VoucherTriggerService();

