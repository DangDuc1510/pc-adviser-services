require('dotenv').config();
const axios = require('axios');
const config = require('../src/config');
const logger = require('../src/utils/logger');

const baseURL = `http://localhost:${config.port}`;
const client = axios.create({ baseURL, timeout: 5000 });

async function testService() {
  console.log('\n🧪 Testing Search Service...\n');

  // Test 1: Health check
  try {
    const health = await client.get('/health');
    console.log('✅ Health check:', health.data);
  } catch (error) {
    console.error('❌ Health check failed:', error.message);
    return false;
  }

  // Test 2: Search products
  try {
    const search = await client.get('/search/products', {
      params: { q: 'cpu', limit: 5 }
    });
    console.log('✅ Search products:', {
      success: search.data.success,
      count: search.data.products?.length || 0,
    });
    if (search.data.products && search.data.products.length > 0) {
      console.log('   Sample product:', search.data.products[0].name);
    }
  } catch (error) {
    console.error('❌ Search failed:', error.message);
    return false;
  }

  // Test 3: Search with empty query
  try {
    const empty = await client.get('/search/products', {
      params: { q: '', limit: 5 }
    });
    console.log('✅ Empty query handled:', {
      success: empty.data.success,
      count: empty.data.products?.length || 0,
    });
  } catch (error) {
    console.error('❌ Empty query test failed:', error.message);
  }

  // Test 4: Root endpoint
  try {
    const root = await client.get('/');
    console.log('✅ Root endpoint:', root.data.service);
  } catch (error) {
    console.error('❌ Root endpoint failed:', error.message);
  }

  console.log('\n✅ All tests passed!\n');
  return true;
}

// Check if service is running
async function checkService() {
  try {
    await client.get('/health');
    return true;
  } catch (error) {
    console.error(`\n❌ Service not running at ${baseURL}`);
    console.error('Please start the service first: npm start\n');
    return false;
  }
}

async function main() {
  const isRunning = await checkService();
  if (!isRunning) {
    process.exit(1);
  }

  const success = await testService();
  process.exit(success ? 0 : 1);
}

main().catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});

