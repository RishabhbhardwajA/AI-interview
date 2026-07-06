import mongoose from 'mongoose';

const connectDB = async () => {
    try {
        const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
        if (!uri) throw new Error("MongoDB URI is not defined in environment variables");
        
        await mongoose.connect(uri);
        console.log("MongoDB connected successfully");
    } catch (err: any) {
        console.error("MongoDB connection failed:", err.message);
        // Removed process.exit(1) so the server stays alive and returns JSON errors instead of crashing!
    }
};

export default connectDB;
