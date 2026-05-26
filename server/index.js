import connectDb from './config/db.js';
import app from './app.js';

const PORT = process.env.PORT || 5000;

/**
 * Start the server with database connection ready.
 * For serverless: connection attempt happens on first request via middleware.
 * For localhost: connection happens before listening.
 */
const startServer = async () => {
  try {
    // Attempt initial connection (will be cached for reuse)
    await connectDb();
    console.log(`✓ Ready to accept requests on port ${PORT}`);
  } catch (error) {
    // On serverless, this may fail on cold start, but middleware will retry
    console.warn(`⚠️  Initial connection attempt failed. Middleware will retry on requests.`);
  }

  const server = app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully...');
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  });
};

startServer().catch(err => {
  console.error('Failed to start server:', err.message);
  process.exit(1);
});