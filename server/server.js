/**
 * server.js
 * 
 * Main entry point for the Braillie Express application.
 * Connects to MongoDB, configures middleware, registers API routes,
 * and starts the HTTP server.
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');

// Initialize Express app
const app = express();

// Connect to MongoDB Atlas
connectDB();

// Core Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Mount API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/textbooks', require('./routes/textbookRoutes'));
app.use('/api/chapters', require('./routes/chapterRoutes'));
app.use('/api/documents', require('./routes/documentRoutes'));
app.use('/api/assignments', require('./routes/assignmentRoutes'));
app.use('/api/print-queue', require('./routes/printQueueRoutes'));
app.use('/api/inventory', require('./routes/inventoryRoutes'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    app: 'Braillie Backend API',
    timestamp: new Date().toISOString()
  });
});

// Global 404 Handler for undefined API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint ${req.originalUrl} does not exist.`
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Global Error]', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`[Server] Braillie backend listening on port ${PORT}`);
});

module.exports = { app, server };
