/**
 * routes/textbookRoutes.js
 * 
 * Endpoints for managing textbooks catalog.
 */

const express = require('express');
const router = express.Router();
const {
  getTextbooks,
  createTextbook,
  getTextbookById,
  updateTextbook,
  deleteTextbook
} = require('../controllers/textbookController');
const { requireAuth, requireRole } = require('../middleware/auth');

// All textbook routes require authentication
router.use(requireAuth);

router.route('/')
  .get(getTextbooks)
  .post(requireRole('admin'), createTextbook);

router.route('/:id')
  .get(getTextbookById)
  .put(requireRole('admin'), updateTextbook)
  .delete(requireRole('admin'), deleteTextbook);

module.exports = router;
