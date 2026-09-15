/**
 * controllers/documentController.js
 * 
 * Manages document uploads, triggers extraction, saves document metadata,
 * updates chapter sourceText, and advances pipeline status to TEXT_EXTRACTION.
 */

const fs = require('fs');
const path = require('path');
const Document = require('../models/Document');
const Chapter = require('../models/Chapter');
const { extractText } = require('../services/textExtractor');
const { logStageChange } = require('../services/auditLogger');

/**
 * @route   POST /api/documents/upload
 * @desc    Upload document (.txt, .pdf, .docx) and extract text to chapter
 * @access  Private
 */
exports.uploadDocument = async (req, res) => {
  const file = req.file;

  if (!file) {
    return res.status(400).json({
      success: false,
      message: 'No file was uploaded. Please attach a .txt, .pdf, or .docx file.'
    });
  }

  const { chapterId } = req.body;
  if (!chapterId) {
    // Delete file since required field missing
    if (file.path && fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }
    return res.status(400).json({
      success: false,
      message: 'chapterId is required to associate the uploaded document.'
    });
  }

  try {
    const chapter = await Chapter.findById(chapterId);
    if (!chapter) {
      if (file.path && fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
      return res.status(404).json({
        success: false,
        message: 'Chapter not found.'
      });
    }

    // Role check: Volunteers can only upload to chapters assigned to them, admin can upload to any
    if (
      req.user.role === 'volunteer' &&
      chapter.assignedVolunteer &&
      chapter.assignedVolunteer.toString() !== req.user._id.toString()
    ) {
      if (file.path && fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
      return res.status(403).json({
        success: false,
        message: 'You are not assigned to this chapter.'
      });
    }

    const ext = path.extname(file.originalname).toLowerCase();
    const fileType = ext.replace('.', '');

    // Attempt text extraction
    let extractedText;
    try {
      extractedText = await extractText(file.path, ext);
    } catch (extractionError) {
      // Clean up uploaded file if extraction fails
      if (file.path && fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
      // On failure: do NOT change chapter's status!
      return res.status(400).json({
        success: false,
        message: `Extraction failed: ${extractionError.message}`
      });
    }

    // Extraction succeeded!
    // 1. Record document metadata in documents collection
    const storageKey = `uploads/${file.filename}`;
    const documentRecord = await Document.create({
      chapterId: chapter._id,
      textbookId: chapter.textbookId,
      filename: file.filename,
      originalName: file.originalname,
      fileType,
      mimeType: file.mimetype,
      storageKey,
      fileSize: file.size,
      uploadedBy: req.user._id,
      extractedLength: extractedText.length
    });

    // 2. Save extracted text to chapter & advance status to TEXT_EXTRACTION
    const prevStage = chapter.status;
    chapter.sourceText = extractedText;
    chapter.status = 'TEXT_EXTRACTION';
    await chapter.save();

    // 3. Log audit history
    await logStageChange(
      chapter._id,
      chapter.textbookId,
      prevStage,
      'TEXT_EXTRACTION',
      req.user._id,
      `Extracted ${extractedText.length} characters from document: ${file.originalname}`
    );

    return res.status(200).json({
      success: true,
      message: 'Document uploaded and text extracted successfully.',
      document: documentRecord,
      extractedLength: extractedText.length,
      preview: extractedText.substring(0, 300),
      chapter
    });
  } catch (error) {
    // Catch-all cleanup
    if (file && file.path && fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }
    console.error('[documentController.uploadDocument] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while processing uploaded document.',
      error: error.message
    });
  }
};

/**
 * @route   GET /api/documents/chapter/:chapterId
 * @desc    Get all uploaded documents for a chapter
 * @access  Private
 */
exports.getDocumentsByChapter = async (req, res) => {
  try {
    const docs = await Document.find({ chapterId: req.params.chapterId })
      .populate('uploadedBy', 'name email')
      .sort({ uploadDate: -1 });

    return res.status(200).json({
      success: true,
      count: docs.length,
      documents: docs
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve documents for chapter.',
      error: error.message
    });
  }
};
