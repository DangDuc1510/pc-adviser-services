const axios = require("axios");
const logger = require("../utils/logger");
const config = require("../config");

class StatisticsService {
  constructor() {
    this.orderServiceUrl = process.env.ORDER_SERVICE_URL;
    this.identityServiceUrl = process.env.IDENTITY_SERVICE_URL;
    this.productServiceUrl = process.env.PRODUCT_SERVICE_URL;
  }

  /**
   * Get dashboard statistics
   */
  async getDashboardStats(authToken) {
    try {
      const headers = {
        Authorization: `Bearer ${authToken}`,
        "x-access-token": authToken,
        "Content-Type": "application/json",
      };

      // Fetch data from all services in parallel
      const [ordersStats, customersStats, productsStats] =
        await Promise.allSettled([
          this.getOrdersStats(headers),
          this.getCustomersStats(headers),
          this.getProductsStats(headers),
        ]);

      // Process results
      const orders =
        ordersStats.status === "fulfilled" ? ordersStats.value : null;
      const customers =
        customersStats.status === "fulfilled" ? customersStats.value : null;
      const products =
        productsStats.status === "fulfilled" ? productsStats.value : null;

      return {
        orders: orders || { error: "Không thể lấy dữ liệu đơn hàng" },
        customers: customers || { error: "Không thể lấy dữ liệu khách hàng" },
        products: products || { error: "Không thể lấy dữ liệu sản phẩm" },
      };
    } catch (error) {
      logger.error("Error getting dashboard stats", { error: error.message });
      throw error;
    }
  }

  /**
   * Get orders statistics
   */
  async getOrdersStats(headers) {
    try {
      const response = await axios.get(`${this.orderServiceUrl}/orders/stats`, {
        headers,
        timeout: 5000,
      });
      return response.data?.data || response.data;
    } catch (error) {
      logger.error("Error fetching orders stats", { error: error.message });
      return null;
    }
  }

  /**
   * Get customers statistics
   */
  async getCustomersStats(headers) {
    try {
      const response = await axios.get(
        `${this.identityServiceUrl}/customers/stats`,
        {
          headers,
          timeout: 5000,
        }
      );
      return response.data?.data || response.data;
    } catch (error) {
      logger.error("Error fetching customers stats", { error: error.message });
      return null;
    }
  }

  /**
   * Get products statistics
   */
  async getProductsStats(headers) {
    try {
      // Get products count
      const productsResponse = await axios.get(
        `${this.productServiceUrl}/products`,
        {
          headers,
          params: { limit: 1 },
          timeout: 5000,
        }
      );

      const totalProducts =
        productsResponse.data?.pagination?.total ||
        productsResponse.data?.total ||
        0;

      // Get categories count
      const categoriesResponse = await axios.get(
        `${this.productServiceUrl}/categories`,
        {
          headers,
          params: { limit: 1 },
          timeout: 5000,
        }
      );

      const totalCategories =
        categoriesResponse.data?.pagination?.total ||
        categoriesResponse.data?.total ||
        0;

      // Get brands count
      const brandsResponse = await axios.get(
        `${this.productServiceUrl}/brands`,
        {
          headers,
          params: { limit: 1 },
          timeout: 5000,
        }
      );

      const totalBrands =
        brandsResponse.data?.pagination?.total ||
        brandsResponse.data?.total ||
        0;

      return {
        totalProducts,
        totalCategories,
        totalBrands,
      };
    } catch (error) {
      logger.error("Error fetching products stats", { error: error.message });
      return null;
    }
  }

  /**
   * Get orders chart data (by date range)
   */
  async getOrdersChartData(authToken, startDate, endDate) {
    try {
      const headers = {
        Authorization: `Bearer ${authToken}`,
        "x-access-token": authToken,
        "Content-Type": "application/json",
      };

      // Get orders with date range
      const response = await axios.get(`${this.orderServiceUrl}/orders`, {
        headers,
        params: {
          limit: 1000, // Get more orders for chart
          startDate,
          endDate,
        },
        timeout: 10000,
      });

      const orders = response.data?.data?.orders || response.data?.orders || [];

      // Group by date
      const chartData = this.groupOrdersByDate(orders, startDate, endDate);

      return chartData;
    } catch (error) {
      logger.error("Error getting orders chart data", { error: error.message });
      throw error;
    }
  }

  /**
   * Group orders by date
   */
  groupOrdersByDate(orders, startDate, endDate) {
    const dataMap = new Map();
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Initialize all dates in range
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateKey = d.toISOString().split("T")[0];
      dataMap.set(dateKey, {
        date: dateKey,
        orders: 0,
        revenue: 0,
      });
    }

    // Aggregate orders
    orders.forEach((order) => {
      const orderDate = new Date(order.createdAt).toISOString().split("T")[0];
      if (dataMap.has(orderDate)) {
        const data = dataMap.get(orderDate);
        data.orders += 1;
        data.revenue += order.pricing?.total || 0;
      }
    });

    return Array.from(dataMap.values());
  }

  /**
   * Get revenue chart data
   */
  async getRevenueChartData(authToken, startDate, endDate) {
    try {
      const chartData = await this.getOrdersChartData(
        authToken,
        startDate,
        endDate
      );

      return chartData.map((item) => ({
        date: item.date,
        revenue: item.revenue,
      }));
    } catch (error) {
      logger.error("Error getting revenue chart data", {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Get orders by status
   */
  async getOrdersByStatus(authToken) {
    try {
      const headers = {
        Authorization: `Bearer ${authToken}`,
        "x-access-token": authToken,
        "Content-Type": "application/json",
      };

      const response = await axios.get(`${this.orderServiceUrl}/orders`, {
        headers,
        params: { limit: 1000 },
        timeout: 10000,
      });

      const orders = response.data?.data?.orders || response.data?.orders || [];

      // Group by status
      const statusCounts = {};
      orders.forEach((order) => {
        const status = order.status || "unknown";
        statusCounts[status] = (statusCounts[status] || 0) + 1;
      });

      return statusCounts;
    } catch (error) {
      logger.error("Error getting orders by status", { error: error.message });
      throw error;
    }
  }

  /**
   * Get user growth statistics
   */
  async getUserGrowthStats(authToken) {
    try {
      // Get all users (excluding admin and employee)
      const usersResponse = await axios.get(
        `${this.identityServiceUrl}/user/internal/users`,
        {
          timeout: 10000,
        }
      );

      const users = usersResponse.data?.data || usersResponse.data?.users || [];

      if (users.length === 0) {
        return {
          newCustomers: 0,
          activeGrowthByWeek: [],
          deactiveByWeek: [],
        };
      }

      // Get customer info for all users (batch)
      const userIds = users.map((user) => user._id || user.id);
      const customersResponse = await axios.post(
        `${this.identityServiceUrl}/customers/internal/users/batch`,
        { userIds },
        {
          timeout: 15000,
        }
      );

      const customersData =
        customersResponse.data?.data || customersResponse.data || [];

      // Create a map of userId to customer info
      const customerMap = new Map();
      customersData.forEach((item) => {
        if (item.customer) {
          customerMap.set(item.userId, item.customer);
        }
      });

      // Calculate date ranges
      const now = new Date();
      const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const thirtyDaysAgo = new Date(now);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      thirtyDaysAgo.setHours(0, 0, 0, 0);

      // Calculate 4 weeks from current week going backwards
      // Start from the beginning of current week
      const currentWeekStart = new Date(now);
      const currentDayOfWeek = currentWeekStart.getDay();
      const daysToSubtract = currentDayOfWeek === 0 ? 6 : currentDayOfWeek - 1;
      currentWeekStart.setDate(currentWeekStart.getDate() - daysToSubtract);
      currentWeekStart.setHours(0, 0, 0, 0);

      // Initialize week data (4 weeks, from 3 weeks ago to current week)
      const activeGrowthByWeek = [];
      for (let i = 3; i >= 0; i--) {
        const weekStart = new Date(currentWeekStart);
        weekStart.setDate(weekStart.getDate() - i * 7);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);

        activeGrowthByWeek.push({
          week: `Tuần ${4 - i}`,
          weekStart: weekStart.toISOString(),
          weekEnd: weekEnd.toISOString(),
          count: 0,
        });
      }

      // Calculate the earliest date we're tracking (3 weeks ago from current week start)
      const fourWeeksAgo = new Date(currentWeekStart);
      fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 21);
      fourWeeksAgo.setHours(0, 0, 0, 0);

      // Initialize weekly deactive data (4 weeks)
      const deactiveByWeek = [];
      for (let i = 3; i >= 0; i--) {
        const weekStart = new Date(currentWeekStart);
        weekStart.setDate(weekStart.getDate() - i * 7);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);

        deactiveByWeek.push({
          week: `Tuần ${4 - i}`,
          weekStart: weekStart.toISOString(),
          weekEnd: weekEnd.toISOString(),
          count: 0,
        });
      }

      // Count new customers in current month
      let newCustomers = 0;

      // Process customers (use customer data instead of user data)
      customersData.forEach((item) => {
        if (!item.customer) return;

        const customer = item.customer;
        const firstSeenAt = customer.firstSeenAt
          ? new Date(customer.firstSeenAt)
          : customer.createdAt
          ? new Date(customer.createdAt)
          : null;
        const lastSeenAt = customer.lastSeenAt
          ? new Date(customer.lastSeenAt)
          : null;

        if (!firstSeenAt) return;

        // Count new customers in current month (based on firstSeenAt)
        if (firstSeenAt >= currentMonthStart) {
          newCustomers++;
        }

        // Calculate active growth by week (based on lastSeenAt)
        // Count customers who were active (had activity) in each week
        if (lastSeenAt && lastSeenAt >= fourWeeksAgo) {
          activeGrowthByWeek.forEach((week) => {
            const weekStart = new Date(week.weekStart);
            const weekEnd = new Date(week.weekEnd);
            if (lastSeenAt >= weekStart && lastSeenAt <= weekEnd) {
              week.count++;
            }
          });
        }

        // Calculate deactive by week
        // A customer is considered deactive on the week they reach 30 days of inactivity
        // Example: If lastSeenAt is Jan 1, they become deactive on Jan 31 (week containing Jan 31)
        if (lastSeenAt) {
          const daysSinceLastSeen = Math.floor(
            (now - lastSeenAt) / (1000 * 60 * 60 * 24)
          );

          // If customer hasn't been seen for 30+ days
          if (daysSinceLastSeen >= 30) {
            // Calculate the deactive date (30 days after lastSeenAt)
            const deactiveDate = new Date(lastSeenAt);
            deactiveDate.setDate(deactiveDate.getDate() + 30);
            deactiveDate.setHours(0, 0, 0, 0);

            // Find which week the deactive date falls into
            if (deactiveDate >= fourWeeksAgo && deactiveDate <= now) {
              deactiveByWeek.forEach((week) => {
                const weekStart = new Date(week.weekStart);
                const weekEnd = new Date(week.weekEnd);
                if (deactiveDate >= weekStart && deactiveDate <= weekEnd) {
                  week.count++;
                }
              });
            }
          }
        }
      });

      // Format week data for response
      const formattedActiveGrowth = activeGrowthByWeek.map((week) => ({
        week: week.week,
        count: week.count,
      }));

      // Format week data for deactive
      const formattedDeactiveByWeek = deactiveByWeek.map((week) => ({
        week: week.week,
        count: week.count,
      }));

      return {
        newCustomers,
        activeGrowthByWeek: formattedActiveGrowth,
        deactiveByWeek: formattedDeactiveByWeek,
      };
    } catch (error) {
      logger.error("Error getting user growth stats", {
        error: error.message,
      });
      throw error;
    }
  }
}

module.exports = new StatisticsService();
