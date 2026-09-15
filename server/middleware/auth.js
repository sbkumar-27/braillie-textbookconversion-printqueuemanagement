/**
 * middleware/auth.js
 * 
 * Middleware for protecting routes using JSON Web Tokens (JWT)
 * and enforcing Role-Based Access Control (RBAC).
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * requireAuth
 * Verifies that an incoming HTTP request carries a valid Bearer token.
 * Populates req.user with the user profile if valid.
 */
const requireAuth = async (req, res, next) => {
  try {
    let token = null;

    // Check Authorization header format: "Bearer <token>"
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer ')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No authentication token provided.'
      });
    }

    // Verify token with our secret
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret');

    // Fetch user without password
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'The account associated with this token no longer exists.'
      });
    }

    // Attach user to request object
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired authentication token.',
      error: error.message
    });
  }
};

/**
 * requireRole
 * Restricts route access to specified roles (e.g. 'admin').
 * @param  {...string} roles - e.g. 'admin', 'volunteer'
 */
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User authentication required before role checking.'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Access restricted to roles [${roles.join(', ')}]. Your role is '${req.user.role}'.`
      });
    }

    next();
  };
};

module.exports = {
  requireAuth,
  requireRole
};
