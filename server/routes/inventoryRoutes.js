/**
 * routes/inventoryRoutes.js
 * 
 * Endpoints for managing Braille paper inventory.
 */

const express = require('express');
const router = express.Router();
const {
  getInventory,
  addStock,
  updateSettings
} = require('../controllers/inventoryController');
const { requireAuth, requireRole } = require('../middleware/auth');

router.use(requireAuth);

router.get('/', getInventory);
router.post('/add-stock', requireRole('admin'), addStock);
router.put('/settings', requireRole('admin'), updateSettings);

module.exports = router;
