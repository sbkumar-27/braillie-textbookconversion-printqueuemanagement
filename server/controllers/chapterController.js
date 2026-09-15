/**
 * controllers/chapterController.js
 * 
 * Manages chapter creation, retrieval, updates, and stage audit history.
 */

const Chapter = require('../models/Chapter');
const Textbook = require('../models/Textbook');
const StageHistory = require('../models/StageHistory');
const PrintQueue = require('../models/PrintQueue');
const { logStageChange } = require('../services/auditLogger');
const { convertToBraille } = require('../services/brailleConverter');

/**
 * @route   GET /api/chapters
 * @desc    Get chapters with optional filters (textbookId, status, assignedVolunteer)
 * @access  Private
 */
exports.getChapters = async (req, res) => {
  try {
    const { textbookId, status, assignedVolunteer } = req.query;
    const filter = {};

    if (textbookId) filter.textbookId = textbookId;
    if (status) filter.status = status;
    if (assignedVolunteer) filter.assignedVolunteer = assignedVolunteer;

    // If user is volunteer and no specific filter passed, default to their assignments
    if (req.user.role === 'volunteer' && !textbookId && !assignedVolunteer) {
      filter.assignedVolunteer = req.user._id;
    }

    const chapters = await Chapter.find(filter)
      .populate('textbookId', 'title author subject gradeClass')
      .populate('assignedVolunteer', 'name email')
      .sort({ chapterNumber: 1 });

    return res.status(200).json({
      success: true,
      count: chapters.length,
      chapters
    });
  } catch (error) {
    console.error('[chapterController.getChapters] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve chapters.',
      error: error.message
    });
  }
};

/**
 * @route   POST /api/chapters
 * @desc    Create a new chapter in a textbook
 * @access  Private (Admin only)
 */
exports.createChapter = async (req, res) => {
  try {
    const { textbookId, chapterNumber, chapterTitle, assignedVolunteer } = req.body;

    if (!textbookId || !chapterNumber || !chapterTitle) {
      return res.status(400).json({
        success: false,
        message: 'textbookId, chapterNumber, and chapterTitle are required.'
      });
    }

    // Verify textbook exists
    const textbook = await Textbook.findById(textbookId);
    if (!textbook) {
      return res.status(404).json({
        success: false,
        message: 'Associated textbook not found.'
      });
    }

    const chapter = await Chapter.create({
      textbookId,
      chapterNumber,
      chapterTitle,
      assignedVolunteer: assignedVolunteer || null,
      status: 'PENDING'
    });

    // Audit initial creation
    await logStageChange(
      chapter._id,
      textbookId,
      'NONE',
      'PENDING',
      req.user._id,
      'Chapter created and initialized to PENDING status'
    );

    return res.status(201).json({
      success: true,
      message: 'Chapter created successfully.',
      chapter
    });
  } catch (error) {
    console.error('[chapterController.createChapter] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create chapter.',
      error: error.message
    });
  }
};

/**
 * @route   GET /api/chapters/:id
 * @desc    Get single chapter details
 * @access  Private
 */
exports.getChapterById = async (req, res) => {
  try {
    const chapter = await Chapter.findById(req.params.id)
      .populate('textbookId', 'title author subject gradeClass')
      .populate('assignedVolunteer', 'name email');

    if (!chapter) {
      return res.status(404).json({
        success: false,
        message: 'Chapter not found.'
      });
    }

    return res.status(200).json({
      success: true,
      chapter
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve chapter.',
      error: error.message
    });
  }
};

/**
 * @route   PUT /api/chapters/:id
 * @desc    Update basic chapter metadata (title, number, assigned volunteer)
 * @access  Private (Admin or assigned Volunteer)
 */
exports.updateChapter = async (req, res) => {
  try {
    const { chapterTitle, chapterNumber, assignedVolunteer, sourceText, brailleText, status } = req.body;

    const chapter = await Chapter.findById(req.params.id);
    if (!chapter) {
      return res.status(404).json({
        success: false,
        message: 'Chapter not found.'
      });
    }

    const prevStage = chapter.status;

    if (chapterTitle !== undefined) chapter.chapterTitle = chapterTitle;
    if (chapterNumber !== undefined) chapter.chapterNumber = chapterNumber;
    if (assignedVolunteer !== undefined) chapter.assignedVolunteer = assignedVolunteer;
    if (sourceText !== undefined) chapter.sourceText = sourceText;
    if (brailleText !== undefined) chapter.brailleText = brailleText;

    if (status && status !== prevStage) {
      chapter.status = status;
      await logStageChange(
        chapter._id,
        chapter.textbookId,
        prevStage,
        status,
        req.user._id,
        req.body.note || `Stage updated manually to ${status}`
      );
    }

    await chapter.save();

    return res.status(200).json({
      success: true,
      message: 'Chapter updated successfully.',
      chapter
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update chapter.',
      error: error.message
    });
  }
};

/**
 * @route   DELETE /api/chapters/:id
 * @desc    Delete a chapter (Admin only)
 * @access  Private (Admin only)
 */
exports.deleteChapter = async (req, res) => {
  try {
    const chapter = await Chapter.findById(req.params.id);
    if (!chapter) {
      return res.status(404).json({
        success: false,
        message: 'Chapter not found.'
      });
    }

    await StageHistory.deleteMany({ chapterId: chapter._id });
    await chapter.deleteOne();

    return res.status(200).json({
      success: true,
      message: 'Chapter deleted successfully.'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to delete chapter.',
      error: error.message
    });
  }
};

/**
 * @route   GET /api/chapters/:id/history
 * @desc    Get complete audit timeline of stage transitions for this chapter
 * @access  Private
 */
exports.getChapterHistory = async (req, res) => {
  try {
    const history = await StageHistory.find({ chapterId: req.params.id })
      .populate('changedBy', 'name email role')
      .sort({ timestamp: -1 });

    return res.status(200).json({
      success: true,
      count: history.length,
      history
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve chapter audit history.',
      error: error.message
    });
  }
};

/**
 * @route   POST /api/chapters/:id/translate
 * @desc    Run automated Braille conversion on chapter sourceText
 * @access  Private
 */
exports.translateChapter = async (req, res) => {
  try {
    const { brailleGrade } = req.body;
    const chapter = await Chapter.findById(req.params.id);

    if (!chapter) {
      return res.status(404).json({
        success: false,
        message: 'Chapter not found.'
      });
    }

    if (!chapter.sourceText || chapter.sourceText.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'No source text available to translate. Please upload a document or enter text first.'
      });
    }

    const selectedGrade = brailleGrade && ['GRADE_1', 'GRADE_2'].includes(brailleGrade)
      ? brailleGrade
      : chapter.brailleGrade || 'GRADE_1';

    // Perform actual Unicode Braille translation
    const brailleOutput = convertToBraille(chapter.sourceText, selectedGrade);
    const estimatedPages = Math.max(1, Math.ceil(brailleOutput.length / 1000));

    const prevStage = chapter.status;
    chapter.brailleText = brailleOutput;
    chapter.brailleGrade = selectedGrade;
    chapter.pageCount = estimatedPages;

    // Advance stage to BRAILLE_TRANSLATION if starting from prior stage
    if (['PENDING', 'TEXT_EXTRACTION'].includes(chapter.status)) {
      chapter.status = 'BRAILLE_TRANSLATION';
    }

    await chapter.save();

    // Log stage history
    await logStageChange(
      chapter._id,
      chapter.textbookId,
      prevStage,
      chapter.status,
      req.user._id,
      `Translated text to Unicode Braille (${selectedGrade}). Generated ${brailleOutput.length} Braille cells (~${estimatedPages} pages).`
    );

    return res.status(200).json({
      success: true,
      message: `Translated successfully using ${selectedGrade}.`,
      chapter
    });
  } catch (error) {
    console.error('[chapterController.translateChapter] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to translate chapter text.',
      error: error.message
    });
  }
};

/**
 * @route   PUT /api/chapters/:id/proofread
 * @desc    Save volunteer edits during proofreading and immediately re-translate
 * @access  Private
 */
exports.proofreadChapter = async (req, res) => {
  try {
    const { sourceText, brailleGrade, note } = req.body;
    const chapter = await Chapter.findById(req.params.id);

    if (!chapter) {
      return res.status(404).json({
        success: false,
        message: 'Chapter not found.'
      });
    }

    if (sourceText !== undefined) {
      chapter.sourceText = sourceText;
    }

    if (brailleGrade && ['GRADE_1', 'GRADE_2'].includes(brailleGrade)) {
      chapter.brailleGrade = brailleGrade;
    }

    // Re-generate Braille based on the updated source text
    if (chapter.sourceText) {
      chapter.brailleText = convertToBraille(chapter.sourceText, chapter.brailleGrade);
      chapter.pageCount = Math.max(1, Math.ceil(chapter.brailleText.length / 1000));
    }

    const prevStage = chapter.status;
    // Advance status to PROOFREADING
    chapter.status = 'PROOFREADING';
    await chapter.save();

    // Audit stage change or edit save
    await logStageChange(
      chapter._id,
      chapter.textbookId,
      prevStage,
      'PROOFREADING',
      req.user._id,
      note || 'Proofreader edited source text and re-translated Braille.'
    );

    return res.status(200).json({
      success: true,
      message: 'Proofreading updates and Braille re-translation saved.',
      chapter
    });
  } catch (error) {
    console.error('[chapterController.proofreadChapter] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to save proofreading changes.',
      error: error.message
    });
  }
};

/**
 * @route   POST /api/chapters/:id/approve
 * @desc    Mandatory human approval: moves status from PROOFREADING -> EMBOSSING
 *          and enqueues chapter into the Print/Embossing Queue.
 * @access  Private
 */
exports.approveChapter = async (req, res) => {
  try {
    const { note } = req.body;
    const chapter = await Chapter.findById(req.params.id);

    if (!chapter) {
      return res.status(404).json({
        success: false,
        message: 'Chapter not found.'
      });
    }

    if (!chapter.brailleText || chapter.brailleText.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Cannot approve chapter without generated Braille text.'
      });
    }

    // Check if already approved or done
    if (['EMBOSSING', 'DONE'].includes(chapter.status)) {
      return res.status(400).json({
        success: false,
        message: `Chapter is already in '${chapter.status}' stage.`
      });
    }

    const prevStage = chapter.status;
    chapter.status = 'EMBOSSING';
    await chapter.save();

    // Calculate queue position
    const currentQueuedCount = await PrintQueue.countDocuments({ status: 'QUEUED' });
    const queuePosition = currentQueuedCount + 1;

    // Create entry in PrintQueue
    const printJob = await PrintQueue.create({
      chapterId: chapter._id,
      textbookId: chapter.textbookId,
      queuePosition,
      brailleSummary: {
        charCount: chapter.brailleText.length,
        estimatedPages: chapter.pageCount || Math.max(1, Math.ceil(chapter.brailleText.length / 1000))
      },
      status: 'QUEUED',
      requestedBy: req.user._id
    });

    // Audit stage change
    await logStageChange(
      chapter._id,
      chapter.textbookId,
      prevStage,
      'EMBOSSING',
      req.user._id,
      note || `Approved by transcriber. Enqueued into print queue at position #${queuePosition}.`
    );

    return res.status(200).json({
      success: true,
      message: 'Chapter approved and enqueued for embossing.',
      chapter,
      printJob
    });
  } catch (error) {
    console.error('[chapterController.approveChapter] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to approve chapter for embossing.',
      error: error.message
    });
  }
};

