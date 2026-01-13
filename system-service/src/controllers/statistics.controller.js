const statisticsService = require("../services/statistics.service");
const logger = require("../utils/logger");

/**
 * GET /statistics/dashboard
 * Get dashboard statistics
 */
const getDashboardStats = async (req, res, next) => {
  try {
    const authToken =
      req.headers["x-access-token"] ||
      req.headers.authorization?.replace("Bearer ", "");

    if (!authToken) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized",
        message: "Authentication token required",
      });
    }

    const stats = await statisticsService.getDashboardStats(authToken);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    logger.error("Error in getDashboardStats", { error: error.message });
    next(error);
  }
};

/**
 * GET /statistics/orders/chart
 * Get orders chart data
 */
const getOrdersChartData = async (req, res, next) => {
  try {
    const authToken =
      req.headers["x-access-token"] ||
      req.headers.authorization?.replace("Bearer ", "");

    if (!authToken) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized",
        message: "Authentication token required",
      });
    }

    const startDate =
      req.query.startDate ||
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const endDate = req.query.endDate || new Date().toISOString();

    const chartData = await statisticsService.getOrdersChartData(
      authToken,
      startDate,
      endDate
    );

    res.json({
      success: true,
      data: chartData,
    });
  } catch (error) {
    logger.error("Error in getOrdersChartData", { error: error.message });
    next(error);
  }
};

/**
 * GET /statistics/revenue/chart
 * Get revenue chart data
 */
const getRevenueChartData = async (req, res, next) => {
  try {
    const authToken =
      req.headers["x-access-token"] ||
      req.headers.authorization?.replace("Bearer ", "");

    if (!authToken) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized",
        message: "Authentication token required",
      });
    }

    const startDate =
      req.query.startDate ||
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const endDate = req.query.endDate || new Date().toISOString();

    const chartData = await statisticsService.getRevenueChartData(
      authToken,
      startDate,
      endDate
    );

    res.json({
      success: true,
      data: chartData,
    });
  } catch (error) {
    logger.error("Error in getRevenueChartData", { error: error.message });
    next(error);
  }
};

/**
 * GET /statistics/orders/status
 * Get orders by status
 */
const getOrdersByStatus = async (req, res, next) => {
  try {
    const authToken =
      req.headers["x-access-token"] ||
      req.headers.authorization?.replace("Bearer ", "");

    if (!authToken) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized",
        message: "Authentication token required",
      });
    }

    const statusCounts = await statisticsService.getOrdersByStatus(authToken);

    res.json({
      success: true,
      data: statusCounts,
    });
  } catch (error) {
    logger.error("Error in getOrdersByStatus", { error: error.message });
    next(error);
  }
};

/**
 * GET /statistics/users/growth
 * Get user growth statistics
 */
const getUserGrowthStats = async (req, res, next) => {
  try {
    const authToken =
      req.headers["x-access-token"] ||
      req.headers.authorization?.replace("Bearer ", "");

    if (!authToken) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized",
        message: "Authentication token required",
      });
    }

    const stats = await statisticsService.getUserGrowthStats(authToken);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    logger.error("Error in getUserGrowthStats", { error: error.message });
    next(error);
  }
};

module.exports = {
  getDashboardStats,
  getOrdersChartData,
  getRevenueChartData,
  getOrdersByStatus,
  getUserGrowthStats,
};
