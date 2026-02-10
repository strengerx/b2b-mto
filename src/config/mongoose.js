import mongoose from 'mongoose';
import { MONGO_URI, NODE_ENV, MONGO_POOL_SIZE } from './env.js';

mongoose.set('strictQuery', true);

export const connectDB = async () => {
    try {
        const conn = await mongoose.connect(MONGO_URI, {
            autoIndex: NODE_ENV !== 'production',
            maxPoolSize: MONGO_POOL_SIZE || 10,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });

        console.log(`🟢 MongoDB connected: ${conn.connection.host}`);
        return conn;
    } catch (err) {
        console.error('🔴 MongoDB connection failed:', err);
        throw err; // let server bootstrap handle crash
    }
};

mongoose.connection.on('disconnected', () => {
    console.warn('⚠ MongoDB disconnected');
});

mongoose.connection.on('reconnected', () => {
    console.log('🟢 MongoDB reconnected');
});

mongoose.connection.on('error', (err) => {
    console.error('❌ MongoDB runtime error:', err);
});
