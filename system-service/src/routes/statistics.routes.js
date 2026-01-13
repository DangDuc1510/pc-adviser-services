const express = require("express");
const router = express.Router();
const statisticsController = require("../controllers/statistics.controller");

// Dashboard statistics
router.get("/dashboard", statisticsController.getDashboardStats);

// Chart data
router.get("/orders/chart", statisticsController.getOrdersChartData);
router.get("/revenue/chart", statisticsController.getRevenueChartData);
router.get("/orders/status", statisticsController.getOrdersByStatus);
router.get("/users/growth", statisticsController.getUserGrowthStats);

module.exports = router;
