const VoucherRule = require("../models/voucherRule.model");

class VoucherRuleRepository {
  async findById(id, populate = true) {
    const query = VoucherRule.findById(id);
    // Note: createdBy and updatedBy are ObjectIds, not populated
    // User info can be fetched via identity-client if needed
    return await query.exec();
  }

  async findAll(filters = {}, options = {}) {
    const { page = 1, limit = 20, sort = { createdAt: -1 } } = options;

    const query = VoucherRule.find(filters);

    // Apply sorting
    query.sort(sort);

    // Apply pagination
    const skip = (page - 1) * limit;
    query.skip(skip).limit(limit);

    // Note: createdBy and updatedBy are ObjectIds, not populated
    // User info can be fetched via identity-client if needed

    const [rules, total] = await Promise.all([
      query.exec(),
      VoucherRule.countDocuments(filters),
    ]);

    return {
      rules,
      pagination: {
        current: page,
        pageSize: limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async create(ruleData) {
    const rule = new VoucherRule(ruleData);
    return await rule.save();
  }

  async update(id, updateData) {
    return await VoucherRule.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );
    // Note: createdBy and updatedBy are ObjectIds, not populated
    // User info can be fetched via identity-client if needed
  }

  async delete(id) {
    return await VoucherRule.findByIdAndDelete(id);
  }

  async findActiveRulesByTriggerType(triggerType) {
    return await VoucherRule.find({
      isActive: true,
      triggerType: triggerType,
    }).exec();
  }

  async findRulesToExecute(now = new Date()) {
    return await VoucherRule.find({
      isActive: true,
      $or: [
        { schedule: { type: "realtime" } },
        {
          schedule: { type: "daily" },
          nextExecutionAt: { $lte: now },
        },
        {
          schedule: { type: "weekly" },
          nextExecutionAt: { $lte: now },
        },
      ],
    }).exec();
  }

  async incrementDistributionCount(ruleId, count = 1) {
    return await VoucherRule.findByIdAndUpdate(
      ruleId,
      { $inc: { distributionCount: count } },
      { new: true }
    );
  }

  async updateExecutionTime(ruleId, lastExecutedAt, nextExecutionAt) {
    return await VoucherRule.findByIdAndUpdate(
      ruleId,
      {
        lastExecutedAt,
        nextExecutionAt,
      },
      { new: true }
    );
  }
}

module.exports = new VoucherRuleRepository();

