import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config({ quiet: true });

const coonectDb = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URL, {
            serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
        });
        console.log("Database connected successfully");
    } catch (error) {
        console.error("Database connection failed:");
        console.error(error.message);
        console.warn("⚠️  Server will start without database. Some features requiring DB will not work.");
        console.warn("   Update MONGODB_URL in server/.env or check your network connection.");
    }
};

export default coonectDb;
