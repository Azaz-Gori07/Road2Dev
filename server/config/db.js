import mongoose from "mongoose";
import dotenv from "dotenv";
import dns from "dns";

dotenv.config({ quiet: true });

// Configure custom DNS servers if provided in env
if (process.env.DNS_SERVERS) {
  try {
    const servers = process.env.DNS_SERVERS.split(",").map(s => s.trim());
    dns.setServers(servers);
    console.log(`✓ DNS servers set to: ${servers.join(", ")}`);
  } catch (err) {
    console.warn(`⚠️ Failed to set DNS servers from env: ${err.message}`);
  }
}

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
    let connection;
    try {
      connection = await mongoose.connect(process.env.MONGODB_URL, {
        // Serverless-optimized connection options
        serverSelectionTimeoutMS: 5000,      // Quick timeout for cold starts
        socketTimeoutMS: 10000,              // Socket timeout for long operations
        maxPoolSize: 10,                     // Limit connection pool for serverless
        minPoolSize: 1,                      // Minimum connections to maintain
        waitQueueTimeoutMS: 10000,           // Max wait for available connection
        retryWrites: true,                   // Retry writes for better reliability
        appName: 'road2dev-serverless',      // Identify app in MongoDB logs
      });
    } catch (error) {
      // Check if it's a DNS resolution error that might be fixed by public DNS
      if (error.code === 'ECONNREFUSED' && error.syscall === 'querySrv') {
        console.warn("⚠️ DNS SRV resolution failed. Retrying with Google/Cloudflare public DNS servers...");
        try {
          dns.setServers(['8.8.8.8', '1.1.1.1']);
          connection = await mongoose.connect(process.env.MONGODB_URL, {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 10000,
            maxPoolSize: 10,
            minPoolSize: 1,
            waitQueueTimeoutMS: 10000,
            retryWrites: true,
            appName: 'road2dev-serverless',
          });
        } catch (retryError) {
          console.error("✗ Database connection failed after retrying with public DNS:");
          console.error(retryError.message);
          throw retryError;
        }
      } else {
        console.error("✗ Database connection failed:");
        console.error(error.message);
        console.warn("⚠️  Server will attempt to retry. Some features requiring DB will not work.");
        throw error;
      }
    }

    console.log("✓ Database connected successfully");
    return connection;
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
