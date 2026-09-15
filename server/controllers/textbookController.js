/**
 * controllers/textbookController.js
 * 
 * Handles CRUD operations for textbooks.
 */

const Textbook = require('../models/Textbook');
const Chapter = require('../models/Chapter');

/**
 * @route   GET /api/textbooks
 * @desc    Get all textbooks with progress stats
 * @access  Private
 */
exports.getTextbooks = async (req, res) => {
  try {
    const textbooks = await Textbook.find().sort({ createdAt: -1 });

    // Enrich with chapter counts and completion stats
    const enrichedTextbooks = await Promise.all(
      textbooks.map(async (book) => {
        const totalChapters = await Chapter.countDocuments({ textbookId: book._id });
        const completedChapters = await Chapter.countDocuments({
          textbookId: book._id,
          status: 'DONE'
        });
        return {
          ...book.toObject(),
          totalChapters,
          completedChapters,
          progressPercent: totalChapters > 0 ? Math.round((completedChapters / totalChapters) * 100) : 0
        };
      })
    );

    return res.status(200).json({
      success: true,
      count: enrichedTextbooks.length,
      textbooks: enrichedTextbooks
    });
  } catch (error) {
    console.error('[textbookController.getTextbooks] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve textbooks.',
      error: error.message
    });
  }
};

/**
 * @route   POST /api/textbooks
 * @desc    Create a new textbook
 * @access  Private (Admin only)
 */
exports.createTextbook = async (req, res) => {
  try {
    const { title, author, subject, gradeClass, publisher, description } = req.body;

    if (!title || !author || !subject || !gradeClass) {
      return res.status(400).json({
        success: false,
        message: 'Title, author, subject, and class/grade are required.'
      });
    }

    const textbook = await Textbook.create({
      title,
      author,
      subject,
      gradeClass,
      publisher,
      description,
      createdBy: req.user._id
    });

    return res.status(201).json({
      success: true,
      message: 'Textbook created successfully.',
      textbook
    });
  } catch (error) {
    console.error('[textbookController.createTextbook] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create textbook.',
      error: error.message
    });
  }
};

/**
 * @route   GET /api/textbooks/:id
 * @desc    Get single textbook with its chapters
 * @access  Private
 */
exports.getTextbookById = async (req, res) => {
  try {
    const textbook = await Textbook.findById(req.params.id);
    if (!textbook) {
      return res.status(404).json({
        success: false,
        message: 'Textbook not found.'
      });
    }

    // Retrieve all chapters belonging to this textbook
    const chapters = await Chapter.find({ textbookId: textbook._id })
      .populate('assignedVolunteer', 'name email')
      .sort({ chapterNumber: 1 });

    return res.status(200).json({
      success: true,
      textbook,
      chapters
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve textbook.',
      error: error.message
    });
  }
};

/**
 * @route   PUT /api/textbooks/:id
 * @desc    Update textbook details
 * @access  Private (Admin only)
 */
exports.updateTextbook = async (req, res) => {
  try {
    const textbook = await Textbook.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!textbook) {
      return res.status(404).json({
        success: false,
        message: 'Textbook not found.'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Textbook updated successfully.',
      textbook
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update textbook.',
      error: error.message
    });
  }
};

/**
 * @route   DELETE /api/textbooks/:id
 * @desc    Delete textbook and associated chapters
 * @access  Private (Admin only)
 */
exports.deleteTextbook = async (req, res) => {
  try {
    const textbook = await Textbook.findById(req.params.id);
    if (!textbook) {
      return res.status(404).json({
        success: false,
        message: 'Textbook not found.'
      });
    }

    // Remove associated chapters
    await Chapter.deleteMany({ textbookId: textbook._id });
    await textbook.deleteOne();

    return res.status(200).json({
      success: true,
      message: 'Textbook and associated chapters deleted successfully.'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to delete textbook.',
      error: error.message
    });
  }
};
