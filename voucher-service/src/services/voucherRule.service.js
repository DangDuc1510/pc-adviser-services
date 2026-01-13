const voucherRuleRepository = require('../repositories/voucherRule.repository');
const { ValidationError, NotFoundError } = require('../errors');

class VoucherRuleService {
  async getAllRules(filters = {}, options = {}) {
    return await voucherRuleRepository.findAll(filters, options);
  }

  async getRuleById(ruleId) {
    const rule = await voucherRuleRepository.findById(ruleId);
    if (!rule) {
      throw new NotFoundError('Quy tắc không tồn tại');
    }
    return rule;
  }

  async createRule(ruleData, createdBy) {
    // Validate trigger config based on trigger type
    this._validateTriggerConfig(ruleData.triggerType, ruleData.triggerConfig);

    // Validate voucher template
    this._validateVoucherTemplate(ruleData.voucherTemplate);

    // Set default trigger config values if not provided
    if (ruleData.triggerType === 'spending_milestone' && !ruleData.triggerConfig?.amount) {
      ruleData.triggerConfig = ruleData.triggerConfig || {};
      ruleData.triggerConfig.amount = ruleData.triggerConfig.amount || 20000000;
    }
    if (ruleData.triggerType === 'inactivity_days' && !ruleData.triggerConfig?.days) {
      ruleData.triggerConfig = ruleData.triggerConfig || {};
      ruleData.triggerConfig.days = ruleData.triggerConfig.days || 30;
    }

    ruleData.createdBy = createdBy;
    return await voucherRuleRepository.create(ruleData);
  }

  async updateRule(ruleId, updateData, updatedBy) {
    const rule = await voucherRuleRepository.findById(ruleId);
    if (!rule) {
      throw new NotFoundError('Quy tắc không tồn tại');
    }

    // Validate trigger config if being updated
    if (updateData.triggerConfig) {
      const triggerType = updateData.triggerType || rule.triggerType;
      this._validateTriggerConfig(triggerType, updateData.triggerConfig);
    }

    // Validate voucher template if being updated
    if (updateData.voucherTemplate) {
      this._validateVoucherTemplate(updateData.voucherTemplate);
    }

    updateData.updatedBy = updatedBy;
    return await voucherRuleRepository.update(ruleId, updateData);
  }

  async deleteRule(ruleId) {
    const rule = await voucherRuleRepository.findById(ruleId);
    if (!rule) {
      throw new NotFoundError('Quy tắc không tồn tại');
    }
    return await voucherRuleRepository.delete(ruleId);
  }

  async toggleActive(ruleId) {
    const rule = await voucherRuleRepository.findById(ruleId);
    if (!rule) {
      throw new NotFoundError('Quy tắc không tồn tại');
    }
    return await voucherRuleRepository.update(ruleId, { isActive: !rule.isActive });
  }

  async getActiveRulesByType(triggerType) {
    return await voucherRuleRepository.findActiveRulesByTriggerType(triggerType);
  }

  _validateTriggerConfig(triggerType, config) {
    // Config is optional for user_registered and birthday
    if (!config && (triggerType === 'user_registered' || triggerType === 'birthday')) {
      return; // No config needed
    }

    // Config is optional but can be provided for spending_milestone and inactivity_days
    if (!config && (triggerType === 'spending_milestone' || triggerType === 'inactivity_days')) {
      return; // Will use defaults
    }

    if (config) {
      switch (triggerType) {
        case 'inactivity_days':
          if (config.days !== undefined && config.days < 1) {
            throw new ValidationError('Số ngày không hoạt động phải >= 1');
          }
          break;
        case 'spending_milestone':
          if (config.amount !== undefined && config.amount < 0) {
            throw new ValidationError('Mốc chi tiêu phải >= 0');
          }
          break;
      }
    }
  }

  _validateVoucherTemplate(template) {
    if (!template.name) {
      throw new ValidationError('Tên voucher là bắt buộc');
    }
    if (!template.discountType || !['percentage', 'fixed'].includes(template.discountType)) {
      throw new ValidationError('Loại giảm giá không hợp lệ');
    }
    if (template.discountValue === undefined || template.discountValue < 0) {
      throw new ValidationError('Giá trị giảm giá phải >= 0');
    }
    if (template.discountType === 'percentage' && template.discountValue > 100) {
      throw new ValidationError('Phần trăm giảm giá không được vượt quá 100%');
    }
    if (!template.validityDays || template.validityDays < 1) {
      throw new ValidationError('Số ngày hiệu lực phải >= 1');
    }
  }

}

module.exports = new VoucherRuleService();

