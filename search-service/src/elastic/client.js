const { Client } = require("@elastic/elasticsearch");
const config = require("../config");
const logger = require("../utils/logger");

const clientConfig = {
  node: config.elasticsearch.node,
};

if (config.elasticsearch.auth) {
  clientConfig.auth = config.elasticsearch.auth;
}

const client = new Client(clientConfig);

// Test connection on startup
async function testConnection() {
  try {
    const response = await client.ping();
    logger.info("Elasticsearch connection successful", {
      node: config.elasticsearch.node,
    });
    return true;
  } catch (error) {
    logger.error("Elasticsearch connection failed", {
      error: error.message,
      node: config.elasticsearch.node,
    });
    return false;
  }
}

// Check if index exists
async function indexExists(indexName = config.elasticsearch.index) {
  try {
    const response = await client.indices.exists({ index: indexName });
    return response;
  } catch (error) {
    logger.error("Error checking index existence", {
      error: error.message,
      index: indexName,
    });
    return false;
  }
}

module.exports = {
  client,
  testConnection,
  indexExists,
};
