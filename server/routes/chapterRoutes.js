/**
 * routes/chapterRoutes.js
 * 
 * Endpoints for managing chapters and their conversion stages.
 */

const express = require('express');
const router = express.Router();
const {
  getChapters,
  createChapter,
  getChapterById,
  updateChapter,
  deleteChapter,
  getChapterHistory,
  translateChapter,
  proofreadChapter,
  approveChapter
} = require('../controllers/chapterController');
const { requireAuth, requireRole } = require('../middleware/auth');

router.use(requireAuth);

router.route('/')
  .get(getChapters)
  .post(requireRole('admin'), createChapter);

router.route('/:id')
  .get(getChapterById)
  .put(updateChapter)
  .delete(requireRole('admin'), deleteChapter);

router.get('/:id/history', getChapterHistory);
router.post('/:id/translate', translateChapter);
router.put('/:id/proofread', proofreadChapter);
router.post('/:id/approve', approveChapter);

module.exports = router;
