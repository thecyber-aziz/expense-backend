import mongoose from 'mongoose';

let retryCount = 0;
const maxRetries = 3;
const retryDelay = 3000;

const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI environment variable is not set');
    }

    console.log('🔄 Connecting to MongoDB...');

    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 15000,
      connectTimeoutMS: 15000,
      socketTimeoutMS: 45000,
      bufferCommands: false,  // ✅ FIXED: fail immediately instead of 10s timeout
      maxPoolSize: 10,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    retryCount = 0;
    return conn;

  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);

    if (retryCount < maxRetries) {
      retryCount++;
      console.log(`⏳ Retrying... (${retryCount}/${maxRetries}) in ${retryDelay / 1000}s`);
      await new Promise(resolve => setTimeout(resolve, retryDelay));
      return connectDB();
    } else {
      console.error('❌ Failed to connect to MongoDB after all retries');
      console.error('💡 Check:');
      console.error('   1. MongoDB Atlas → Network Access → Whitelist your IP');
      console.error('   2. Check MONGODB_URI in .env file');
      throw error; // ✅ FIXED: throw so server.js knows it failed
    }
  }
};

export default connectDB;