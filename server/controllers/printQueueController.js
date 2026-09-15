/**
 * controllers/printQueueController.js
 * 
 * Manages the digital print / embossing queue.
 * - Blocks chapters from entering the queue until proofreading approval.
 * - Allows Admin to mark jobs completed, which transitions chapter to DONE,
 *   records paper inventory consumption, and logs stage history.
 */

const PrintQueue = require('../models/PrintQueue');
const Chapter = require('../models/Chapter');
const Inventory = require('../models/Inventory');
const { logStageChange } = require('../services/auditLogger');

/**
 * @route   GET /api/print-queue
 * @desc    Get all embossing jobs in queue
 * @access  Private
 */
exports.getPrintQueue = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const queue = await PrintQueue.find(filter)
      .populate('chapterId', 'chapterTitle chapterNumber status brailleGrade brailleText')
      .populate('textbookId', 'title author subject gradeClass')
      .populate('requestedBy', 'name email')
      .populate('completedBy', 'name email')
      .sort({ status: 1, queuePosition: 1, createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: queue.length,
      queue
    });
  } catch (error) {
    console.error('[printQueueController.getPrintQueue] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve print queue.',
      error: error.message
    });
  }
};

/**
 * @route   POST /api/print-queue
 * @desc    Add a chapter to the embossing queue (Blocks if not approved!)
 * @access  Private (Admin or assigned Volunteer)
 */
exports.createPrintJob = async (req, res) => {
  try {
    const { chapterId } = req.body;

    if (!chapterId) {
      return res.status(400).json({
        success: false,
        message: 'chapterId is required.'
      });
    }

    const chapter = await Chapter.findById(chapterId);
    if (!chapter) {
      return res.status(404).json({
        success: false,
        message: 'Chapter not found.'
      });
    }

    // STRICT CHECK: Block adding to print queue before proofreading approval!
    if (chapter.status !== 'EMBOSSING') {
      return res.status(400).json({
        success: false,
        message: `Cannot add chapter to print queue: Chapter status is '${chapter.status}'. It must be reviewed and approved in proofreading first (status 'EMBOSSING').`
      });
    }

    // Check if already in queue
    const existingJob = await PrintQueue.findOne({
      chapterId: chapter._id,
      status: { $in: ['QUEUED', 'PRINTING'] }
    });
    if (existingJob) {
      return res.status(400).json({
        success: false,
        message: 'This chapter is already in the active embossing queue.'
      });
    }

    const currentQueued = await PrintQueue.countDocuments({ status: 'QUEUED' });
    const queuePosition = currentQueued + 1;
    const estimatedPages = chapter.pageCount || Math.max(1, Math.ceil(chapter.brailleText.length / 1000));

    const printJob = await PrintQueue.create({
      chapterId: chapter._id,
      textbookId: chapter.textbookId,
      queuePosition,
      brailleSummary: {
        charCount: chapter.brailleText.length,
        estimatedPages
      },
      status: 'QUEUED',
      requestedBy: req.user._id
    });

    return res.status(201).json({
      success: true,
      message: 'Chapter added to embossing queue.',
      printJob
    });
  } catch (error) {
    console.error('[printQueueController.createPrintJob] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create print job.',
      error: error.message
    });
  }
};

/**
 * @route   PUT /api/print-queue/:id
 * @desc    Update print job status (e.g. mark COMPLETED or CANCELLED)
 * @access  Private (Admin only)
 */
exports.updatePrintJob = async (req, res) => {
  try {
    const { status, sheetsConsumed } = req.body;

    const job = await PrintQueue.findById(req.params.id)
      .populate('chapterId')
      .populate('textbookId');

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Print queue job not found.'
      });
    }

    if (status === 'COMPLETED') {
      const sheets = parseInt(sheetsConsumed, 10) || job.brailleSummary.estimatedPages || 1;
      
      job.status = 'COMPLETED';
      job.completedBy = req.user._id;
      job.completedDate = new Date();
      job.sheetsConsumed = sheets;
      await job.save();

      // Deduct paper from inventory and record consumption transaction
      const inventory = await Inventory.getOrCreate(req.user._id);
      inventory.currentStock = Math.max(0, inventory.currentStock - sheets);
      inventory.transactions.push({
        type: 'CONSUMED',
        quantity: sheets,
        reason: `Embossed Chapter: ${job.chapterId ? job.chapterId.chapterTitle : 'Unknown'}`,
        chapterId: job.chapterId ? job.chapterId._id : null,
        printJobId: job._id,
        recordedBy: req.user._id,
        date: new Date()
      });
      await inventory.save();

      // Advance chapter status to DONE
      if (job.chapterId) {
        const chapter = await Chapter.findById(job.chapterId._id);
        if (chapter) {
          const prevStage = chapter.status;
          chapter.status = 'DONE';
          await chapter.save();

          await logStageChange(
            chapter._id,
            chapter.textbookId,
            prevStage,
            'DONE',
            req.user._id,
            `Embossing completed. Consumed ${sheets} sheets of Braille paper. Chapter marked as DONE.`
          );
        }
      }

      const isLowStock = inventory.currentStock <= inventory.minReorderLevel;

      return res.status(200).json({
        success: true,
        message: `Job marked COMPLETED. Consumed ${sheets} sheets. Chapter marked as DONE.`,
        job,
        inventory: {
          currentStock: inventory.currentStock,
          minReorderLevel: inventory.minReorderLevel,
          isLowStock,
          warning: isLowStock ? `Paper stock is low (${inventory.currentStock} sheets left)!` : null
        }
      });
    }

    if (status) {
      job.status = status;
      await job.save();
    }

    return res.status(200).json({
      success: true,
      message: 'Print job updated successfully.',
      job
    });
  } catch (error) {
    console.error('[printQueueController.updatePrintJob] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update print job.',
      error: error.message
    });
  }
};
