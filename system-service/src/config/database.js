const mongoose = require('mongoose');
const config = require('./index');
const logger = require('../utils/logger');

let isConnected = false;

const connect = async () => {
  if (isConnected) {
    logger.debug('MongoDB already connected');
    return;
  }

  try {
    const options = {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };

    await mongoose.connect(config.mongodb.uri, options);
    
    isConnected = true;
    logger.info('MongoDB connected successfully', {
      uri: config.mongodb.uri.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@'), // Hide credentials
    });

    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error', { error: err.message });
      isConnected = false;
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
      isConnected = false;
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected');
      isConnected = true;
    });
  } catch (error) {
    logger.error('Failed to connect to MongoDB', { error: error.message });
    throw error;
  }
};

const disconnect = async () => {
  if (!isConnected) {
    return;
  }

  try {
    await mongoose.disconnect();
    isConnected = false;
    logger.info('MongoDB disconnected');
  } catch (error) {
    logger.error('Error disconnecting from MongoDB', { error: error.message });
    throw error;
  }
};

const testConnection = async () => {
  try {
    if (!isConnected) {
      await connect();
    }
    await mongoose.connection.db.admin().ping();
    return true;
  } catch (error) {
    logger.error('MongoDB connection test failed', { error: error.message });
    return false;
  }
};

module.exports = {
  connect,
  disconnect,
  testConnection,
  get connection() {
    return mongoose.connection;
  },
  get isConnected() {
    return isConnected && mongoose.connection.readyState === 1;
  },
};

