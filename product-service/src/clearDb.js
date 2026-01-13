const mongoose = require("mongoose");

const DB_NAME = "test";
const MONGO_URI = "mongodb+srv://ducbd1510:151002@ducbd.a8vx9jc.mongodb.net/?appName=ducbd";

async function clearDatabase() {
  try {
    // Connect to MongoDB with specific database name
    await mongoose.connect(MONGO_URI, {
      dbName: DB_NAME,
    });

    console.log(`✅ Connected to MongoDB database: ${DB_NAME}`);

    // Get all collections in the database
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();

    console.log(`\n📋 Found ${collections.length} collections:`);
    collections.forEach((col) => console.log(`   - ${col.name}`));

    // Filter out 'users' collection
    const collectionsToDelete = collections
      .map((col) => col.name)
      .filter((name) => name !== "users");

    if (collectionsToDelete.length === 0) {
      console.log(
        '\n✅ No collections to delete (only "users" collection exists)'
      );
    } else {
      console.log(
        `\n🗑️  Deleting ${collectionsToDelete.length} collections (keeping "users"):`
      );

      // Delete each collection
      for (const collectionName of collectionsToDelete) {
        await db.collection(collectionName).drop();
        console.log(`   ✓ Deleted: ${collectionName}`);
      }

      console.log("\n✅ Database cleared successfully!");
    }

    // Close connection
    await mongoose.connection.close();
    console.log("\n🔌 Connection closed");
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

// Run the script
clearDatabase();
