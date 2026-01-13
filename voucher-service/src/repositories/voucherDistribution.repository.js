const VoucherDistribution = require('../models/voucherDistribution.model');

class VoucherDistributionRepository {
  async findById(id, populate = true) {
    const query = VoucherDistribution.findById(id);
    if (populate) {
      query.populate('ruleId', 'name triggerType')
           .populate('promoCodeId', 'code name discountType discountValue')
           .populate('orderId', 'orderNumber');
      // Note: userId and customerId are ObjectIds, not populated
      // User/Customer info can be fetched via identity-client if needed
    }
    return await query.exec();
  }

  async findAll(filters = {}, options = {}) {
    const {
      page = 1,
      limit = 20,
      sort = { distributedAt: -1 }
    } = options;

    const query = VoucherDistribution.find(filters);

    // Apply sorting
    query.sort(sort);

    // Apply pagination
    const skip = (page - 1) * limit;
    query.skip(skip).limit(limit);

    // Populate
    query.populate('ruleId', 'name triggerType')
         .populate('promoCodeId', 'code name');
    // Note: userId is ObjectId, not populated
    // User info can be fetched via identity-client if needed

    const [distributions, total] = await Promise.all([
      query.exec(),
      VoucherDistribution.countDocuments(filters)
    ]);

    return {
      distributions,
      pagination: {
        current: page,
        pageSize: limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async create(distributionData) {
    const distribution = new VoucherDistribution(distributionData);
    return await distribution.save();
  }

  async findByUserId(userId) {
    return await VoucherDistribution.find({ userId })
      .populate('ruleId', 'name')
      .populate('promoCodeId', 'code name')
      .sort({ distributedAt: -1 })
      .exec();
    // Note: userId is ObjectId, not populated
    // User info can be fetched via identity-client if needed
  }

  async findByRuleId(ruleId) {
    return await VoucherDistribution.find({ ruleId })
      .populate('promoCodeId', 'code name')
      .sort({ distributedAt: -1 })
      .exec();
    // Note: userId is ObjectId, not populated
    // User info can be fetched via identity-client if needed
  }

  async getStats(filters = {}) {
    const distributions = await VoucherDistribution.find(filters).exec();

    const stats = {
      total: distributions.length,
      pending: distributions.filter(d => d.status === 'pending').length,
      sent: distributions.filter(d => d.status === 'sent').length,
      used: distributions.filter(d => d.status === 'used').length,
      expired: distributions.filter(d => d.status === 'expired').length,
      conversionRate: distributions.length > 0
        ? ((distributions.filter(d => d.status === 'used').length / distributions.length) * 100).toFixed(2)
        : 0
    };

    return stats;
  }
}

module.exports = new VoucherDistributionRepository();

