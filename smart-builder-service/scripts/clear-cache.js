#!/usr/bin/env node

/**
 * Script to clear Redis cache
 * Usage:
 *   node scripts/clear-cache.js                    # Clear all cache
 *   node scripts/clear-cache.js compatible:*        # Clear cache matching pattern
 *   node scripts/clear-cache.js build_suggestions:* # Clear build suggestions cache
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { flushCache } = require('../src/utils/cache');
const { connectRedis } = require('../src/config/redis');
const logger = require('../src/utils/logger');

async function main() {
  const pattern = process.argv[2] || null;
  
  try {
    // Connect to Redis
    await connectRedis();
    
    // Wait a bit for connection to be ready
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    logger.info('Clearing cache...', { pattern: pattern || 'all' });
    
    const result = await flushCache(pattern);
    
    if (result.success) {
      logger.info('Cache cleared successfully', {
        deletedCount: result.deletedCount,
        pattern: result.pattern
      });
      console.log('\n✅ Cache cleared successfully!');
      console.log(`   Pattern: ${result.pattern}`);
      console.log(`   Deleted keys: ${result.deletedCount === -1 ? 'all' : result.deletedCount}`);
    } else {
      logger.error('Failed to clear cache', result);
      console.error('\n❌ Failed to clear cache:', result.error || result.message);
      process.exit(1);
    }
  } catch (error) {
    logger.error('Error clearing cache', error);
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

main();
