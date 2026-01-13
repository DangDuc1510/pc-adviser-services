require('dotenv').config();
const elasticsearchService = require('../src/services/elasticsearch.service');
const productIndexMapping = require('../src/models/product.index');
const logger = require('../src/utils/logger');
const { testConnection } = require('../src/elastic/client');

async function setupIndex() {
  try {
    logger.info('Starting index setup...');

    // Test Elasticsearch connection
    const isConnected = await testConnection();
    if (!isConnected) {
      logger.error('Cannot connect to Elasticsearch. Please check your configuration.');
      process.exit(1);
    }

    // Create index with mapping
    const result = await elasticsearchService.createIndex(productIndexMapping);

    if (result.created) {
      logger.info('Index setup completed successfully');
    } else {
      logger.info(result.message);
    }

    // Refresh index to make it available for search
    await elasticsearchService.refreshIndex();
    logger.info('Index is ready for use');

    process.exit(0);
  } catch (error) {
    logger.error('Index setup failed', { error: error.message });
    process.exit(1);
  }
}

setupIndex();

