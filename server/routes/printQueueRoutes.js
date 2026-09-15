/**
 * routes/printQueueRoutes.js
 * 
 * Endpoints for managing the Embossing / Print Queue.
 */

const express = require('express');
const router = express.Router();
const {
  getPrintQueue,
  createPrintJob,
  updatePrintJob
} = require('../controllers/printQueueController');
const { requireAuth, requireRole } = require('../middleware/auth');

router.use(requireAuth);

router.route('/')
  .get(getPrintQueue)
  .post(createPrintJob);

router.route('/:id')
  .put(requireRole('admin'), updatePrintJob);

module.exports = router;
