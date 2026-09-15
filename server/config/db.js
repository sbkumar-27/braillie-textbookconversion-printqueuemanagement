/**
 * config/db.js
 * 
 * Manages the MongoDB database connection using Mongoose.
 * Reads the connection URI securely from the environment variable (MONGODB_URI).
 */

const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error('MONGODB_URI is not defined in environment variables.');
    }

    // Connect to MongoDB Atlas
    const conn = await mongoose.connect(uri);

    console.log(`[MongoDB] Connected successfully to host: ${conn.connection.host}`);
    console.log(`[MongoDB] Active Database: ${conn.connection.name}`);
  } catch (error) {
    console.error(`[MongoDB] Connection error: ${error.message}`);
    process.exit(1); // Stop server if DB cannot be reached
  }
};

module.exports = connectDB;
