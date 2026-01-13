const amqp = require("amqplib");
const config = require("./index");
const logger = require("../utils/logger");

let connection = null;
let channel = null;
let isConnected = false;

const connect = async () => {
  if (isConnected && connection && channel) {
    logger.debug("RabbitMQ already connected");
    return;
  }

  try {
    connection = await amqp.connect(config.rabbitmq.url);
    channel = await connection.createChannel();

    isConnected = true;
    logger.info("RabbitMQ connected successfully", {
      url: config.rabbitmq.url.replace(/\/\/([^:]+):([^@]+)@/, "//***:***@"),
    });

    connection.on("error", (err) => {
      logger.error("RabbitMQ connection error", { error: err.message });
      isConnected = false;
    });

    connection.on("close", () => {
      logger.warn("RabbitMQ connection closed");
      isConnected = false;
    });
  } catch (error) {
    logger.error("Failed to connect to RabbitMQ", { error: error.message });
    // Don't throw - allow service to run without RabbitMQ
    isConnected = false;
  }
};

const disconnect = async () => {
  if (!isConnected) {
    return;
  }

  try {
    if (channel) {
      await channel.close();
      channel = null;
    }
    if (connection) {
      await connection.close();
      connection = null;
    }
    isConnected = false;
    logger.info("RabbitMQ disconnected");
  } catch (error) {
    logger.error("Error disconnecting from RabbitMQ", { error: error.message });
    isConnected = false;
  }
};

const testConnection = async () => {
  try {
    if (!isConnected || !connection) {
      // Try to connect if not already connected
      try {
        await connect();
      } catch (err) {
        return false;
      }
    }

    if (!connection) {
      return false;
    }

    // Simple check - try to create a temporary channel
    const testChannel = await connection.createChannel();
    await testChannel.close();
    return true;
  } catch (error) {
    logger.debug("RabbitMQ connection test failed", { error: error.message });
    return false;
  }
};

module.exports = {
  connect,
  disconnect,
  testConnection,
  get channel() {
    return channel;
  },
  get connection() {
    return connection;
  },
  get isConnected() {
    return isConnected;
  },
};
