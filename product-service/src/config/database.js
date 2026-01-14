const mongoose = require('mongoose');
const config = require('./env');

const connectDatabase = async () => {
  const maxRetries = 5;
  const retryDelay = 5000; // 5 seconds
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const connection = await mongoose.connect(config.MONGO_URI, {
        dbName: config.MONGODB_DB_NAME,
        serverSelectionTimeoutMS: 10000, // 10 seconds timeout
        socketTimeoutMS: 45000,
      });
      
      console.log('✅ MongoDB connected successfully');
      return connection;
    } catch (error) {
      console.error(`❌ MongoDB connection attempt ${attempt}/${maxRetries} failed:`, error.message);
      
      if (attempt < maxRetries) {
        console.log(`⏳ Retrying in ${retryDelay / 1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      } else {
        console.error('❌ Failed to connect to MongoDB after all retries');
        process.exit(1);
      }
    }
  }
};



// Graceful shutdown
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('MongoDB connection closed through app termination');
  process.exit(0);
});

module.exports = { connectDatabase };
