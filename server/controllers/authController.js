/**
 * controllers/authController.js
 * 
 * Handles user registration, login, profile retrieval,
 * and user listings for assignments.
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Helper function to create a signed JWT token
 */
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    },
    process.env.JWT_SECRET || 'dev_secret',
    {
      expiresIn: '7d' // Session valid for 7 days
    }
  );
};

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user account (Admin or Volunteer)
 * @access  Public
 */
exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Validate presence of required fields
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, and password.'
      });
    }

    // Check if email already registered
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address already exists.'
      });
    }

    // Create new user (role defaults to 'volunteer' if not specified)
    const user = await User.create({
      name,
      email,
      password,
      role: role && ['admin', 'volunteer'].includes(role) ? role : 'volunteer'
    });

    // Generate JWT token
    const token = generateToken(user);

    return res.status(201).json({
      success: true,
      message: 'Account registered successfully.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('[authController.register] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error registering user.',
      error: error.message
    });
  }
};

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user & return JWT token
 * @access  Public
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password.'
      });
    }

    // Find user by email and explicitly select password field (since it is select: false)
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    // Compare plaintext password with stored hash
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    // Generate token
    const token = generateToken(user);

    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('[authController.login] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during login.',
      error: error.message
    });
  }
};

/**
 * @route   GET /api/auth/me
 * @desc    Get currently logged in user profile
 * @access  Private
 */
exports.getMe = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      user: req.user
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error fetching profile.',
      error: error.message
    });
  }
};

/**
 * @route   GET /api/auth/users
 * @desc    Get list of users (e.g. to populate assignment select box)
 * @access  Private (Admin or Volunteer)
 */
exports.getUsers = async (req, res) => {
  try {
    const { role } = req.query;
    const filter = {};
    if (role) filter.role = role;

    const users = await User.find(filter).select('-password').sort({ name: 1 });
    return res.status(200).json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error fetching users.',
      error: error.message
    });
  }
};
