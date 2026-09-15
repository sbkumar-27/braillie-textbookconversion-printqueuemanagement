/**
 * routes/assignmentRoutes.js
 * 
 * Endpoints for volunteer chapter assignments.
 */

const express = require('express');
const router = express.Router();
const {
  createAssignment,
  getAssignments,
  completeAssignment
} = require('../controllers/assignmentController');
const { requireAuth, requireRole } = require('../middleware/auth');

router.use(requireAuth);

router.route('/')
  .get(getAssignments)
  .post(requireRole('admin'), createAssignment);

router.put('/:id/complete', completeAssignment);

module.exports = router;
