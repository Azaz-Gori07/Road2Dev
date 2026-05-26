import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config({ quiet: true });

// Cache the connection promise at module level for serverless reuse
let cachedConnection = null;

/**
 * Connect to MongoDB with connection pooling and caching for serverless environments.
 * The connection is cached globally and reused across function invocations.
 */
const connectDb = async () => {
  // Return cached connection if already connected or connecting
  if (cachedConnection) {
    return cachedConnection;
  }

  // Create connection promise and cache it immediately to prevent multiple concurrent connects
  const connectionPromise = (async () => {
    try {
      const connection = await mongoose.connect(process.env.MONGODB_URL, {
        // Serverless-optimized connection options
        serverSelectionTimeoutMS: 5000,      // Quick timeout for cold starts
        socketTimeoutMS: 10000,              // Socket timeout for long operations
        maxPoolSize: 10,                     // Limit connection pool for serverless
        minPoolSize: 1,                      // Minimum connections to maintain
        waitQueueTimeoutMS: 10000,           // Max wait for available connection
        retryWrites: true,                   // Retry writes for better reliability
        appName: 'road2dev-serverless',      // Identify app in MongoDB logs
      });

      console.log("✓ Database connected successfully");
      return connection;
    } catch (error) {
      console.error("✗ Database connection failed:");
      console.error(error.message);
      console.warn("⚠️  Server will attempt to retry. Some features requiring DB will not work.");
      throw error;
    }
  })();

  cachedConnection = connectionPromise;
  return connectionPromise;
};

/**
 * Get the current connection status.
 * Returns true if connected and ready for queries.
 */
const isConnected = () => {
  return mongoose.connection.readyState === 1;
};

export default connectDb;
export { isConnected };
