/**
 * routes/documentRoutes.js
 * 
 * Endpoints for document uploads and document metadata retrieval.
 */

const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const { requireAuth } = require('../middleware/auth');
const {
  uploadDocument,
  getDocumentsByChapter
} = require('../controllers/documentController');

router.use(requireAuth);

router.post('/upload', upload.single('file'), uploadDocument);
router.get('/chapter/:chapterId', getDocumentsByChapter);

module.exports = router;
