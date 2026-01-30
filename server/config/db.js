import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const coonectDb = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URL);
        console.log("Database connected successfully");
    } catch (error) {
        console.error("Database connection failed:");
        console.error(error.message);
        process.exit(1);
    }
};

export default coonectDb;