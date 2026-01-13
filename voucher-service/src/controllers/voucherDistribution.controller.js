const voucherDistributionRepository = require('../repositories/voucherDistribution.repository');
const { ValidationError } = require('../errors');

// Get all distributions
const getAllDistributions = async (req, res, next) => {
  try {
    const { page, limit, search, status, triggerType, startDate, endDate, sortBy, sortOrder } = req.query;

    const filters = {};
    if (search) {
      // Search by user email - would need to populate and filter
      filters.userId = { $exists: true }; // Placeholder, actual search would need join
    }
    if (status) filters.status = status;
    if (triggerType) filters.triggerType = triggerType;
    if (startDate || endDate) {
      filters.distributedAt = {};
      if (startDate) filters.distributedAt.$gte = new Date(startDate);
      if (endDate) filters.distributedAt.$lte = new Date(endDate);
    }

    const options = {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
      sort: sortBy ? { [sortBy]: sortOrder === 'asc' ? 1 : -1 } : { distributedAt: -1 }
    };

    const result = await voucherDistributionRepository.findAll(filters, options);

    res.json({
      status: 'success',
      data: result.distributions,
      pagination: result.pagination
    });
  } catch (error) {
    next(error);
  }
};

// Get distribution by ID
const getDistributionById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const distribution = await voucherDistributionRepository.findById(id);

    if (!distribution) {
      throw new ValidationError('Bản ghi phân phối không tồn tại');
    }

    res.json({
      status: 'success',
      data: distribution
    });
  } catch (error) {
    next(error);
  }
};

// Get distributions by user ID
const getDistributionsByUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const distributions = await voucherDistributionRepository.findByUserId(userId);

    res.json({
      status: 'success',
      data: distributions
    });
  } catch (error) {
    next(error);
  }
};

// Get distribution statistics
const getDistributionStats = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const filters = {};

    if (startDate || endDate) {
      filters.distributedAt = {};
      if (startDate) filters.distributedAt.$gte = new Date(startDate);
      if (endDate) filters.distributedAt.$lte = new Date(endDate);
    }

    const stats = await voucherDistributionRepository.getStats(filters);

    res.json({
      status: 'success',
      data: stats
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllDistributions,
  getDistributionById,
  getDistributionsByUser,
  getDistributionStats
};

