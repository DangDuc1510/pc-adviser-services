const mongoose = require('mongoose');
const config = require('./env');
const logger = require('../utils/logger');

const connectDatabase = async () => {
  try {
    const connection = await mongoose.connect(config.MONGO_URI, {
      dbName: config.MONGODB_DB_NAME,
    });
    logger.info('MongoDB connected successfully');
    return connection;
  } catch (error) {
    logger.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  logger.info('MongoDB connection closed through app termination');
  process.exit(0);
});

module.exports = { connectDatabase };

