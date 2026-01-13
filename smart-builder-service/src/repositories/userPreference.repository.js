const UserPreference = require('../models/userPreference.model');
const { DatabaseError } = require('../errors');

class UserPreferenceRepository {
  async findByCustomerId(customerId) {
    try {
      return await UserPreference.findOne({ customerId })
        .sort({ lastUpdated: -1 })
        .lean();
    } catch (error) {
      throw new DatabaseError(`Error finding user preference: ${error.message}`);
    }
  }

  async findByUserId(userId) {
    try {
      return await UserPreference.findOne({ userId })
        .sort({ lastUpdated: -1 })
        .lean();
    } catch (error) {
      throw new DatabaseError(`Error finding user preference: ${error.message}`);
    }
  }

  async createOrUpdate(data) {
    try {
      const { customerId, userId } = data;
      const query = customerId ? { customerId } : { userId };
      
      return await UserPreference.findOneAndUpdate(
        query,
        {
          ...data,
          lastUpdated: new Date(),
          expiresAt: new Date(Date.now() + 3600 * 1000) // 1 hour
        },
        { upsert: true, new: true }
      );
    } catch (error) {
      throw new DatabaseError(`Error creating/updating user preference: ${error.message}`);
    }
  }

  async deleteExpired() {
    try {
      return await UserPreference.deleteMany({
        expiresAt: { $lt: new Date() }
      });
    } catch (error) {
      throw new DatabaseError(`Error deleting expired preferences: ${error.message}`);
    }
  }
}

module.exports = new UserPreferenceRepository();

