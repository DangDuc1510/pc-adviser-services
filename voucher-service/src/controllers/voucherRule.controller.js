const voucherRuleService = require('../services/voucherRule.service');
const { ValidationError } = require('../errors');

// Get all voucher rules
const getAllRules = async (req, res, next) => {
  try {
    const { page, limit, search, triggerType, isActive, startDate, endDate, sortBy, sortOrder } = req.query;

    const filters = {};
    if (search) {
      filters.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    if (triggerType) filters.triggerType = triggerType;
    if (isActive !== undefined) filters.isActive = isActive === 'true';

    const options = {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
      sort: sortBy ? { [sortBy]: sortOrder === 'asc' ? 1 : -1 } : { createdAt: -1 }
    };

    const result = await voucherRuleService.getAllRules(filters, options);

    res.json({
      status: 'success',
      data: result.rules,
      pagination: result.pagination
    });
  } catch (error) {
    next(error);
  }
};

// Get rule by ID
const getRuleById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const rule = await voucherRuleService.getRuleById(id);

    res.json({
      status: 'success',
      data: rule
    });
  } catch (error) {
    next(error);
  }
};

// Create new rule
const createRule = async (req, res, next) => {
  try {
    const createdBy = req.user?.id;
    const rule = await voucherRuleService.createRule(req.body, createdBy);

    res.status(201).json({
      status: 'success',
      message: 'Tạo quy tắc thành công',
      data: rule
    });
  } catch (error) {
    next(error);
  }
};

// Update rule
const updateRule = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updatedBy = req.user?.id;
    const rule = await voucherRuleService.updateRule(id, req.body, updatedBy);

    res.json({
      status: 'success',
      message: 'Cập nhật quy tắc thành công',
      data: rule
    });
  } catch (error) {
    next(error);
  }
};

// Delete rule
const deleteRule = async (req, res, next) => {
  try {
    const { id } = req.params;
    await voucherRuleService.deleteRule(id);

    res.json({
      status: 'success',
      message: 'Xóa quy tắc thành công'
    });
  } catch (error) {
    next(error);
  }
};

// Toggle active status
const toggleActive = async (req, res, next) => {
  try {
    const { id } = req.params;
    const rule = await voucherRuleService.toggleActive(id);

    res.json({
      status: 'success',
      message: `Quy tắc đã ${rule.isActive ? 'kích hoạt' : 'ngừng kích hoạt'}`,
      data: rule
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllRules,
  getRuleById,
  createRule,
  updateRule,
  deleteRule,
  toggleActive
};

