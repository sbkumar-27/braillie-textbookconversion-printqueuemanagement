/**
 * routes/authRoutes.js
 * 
 * Defines authentication endpoints.
 */

const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getMe,
  getUsers
} = require('../controllers/authController');
const { requireAuth } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.get('/me', requireAuth, getMe);
router.get('/users', requireAuth, getUsers);

module.exports = router;
