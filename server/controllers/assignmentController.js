/**
 * controllers/assignmentController.js
 * 
 * Manages chapter assignments to volunteer transcribers.
 * Enforces rule: A chapter cannot have multiple active volunteers on the same stage at once.
 */

const Assignment = require('../models/Assignment');
const Chapter = require('../models/Chapter');
const User = require('../models/User');
const { logStageChange } = require('../services/auditLogger');

/**
 * @route   POST /api/assignments
 * @desc    Assign chapter to volunteer transcriber
 * @access  Private (Admin only)
 */
exports.createAssignment = async (req, res) => {
  try {
    const { chapterId, volunteerId, stage, notes } = req.body;

    if (!chapterId || !volunteerId) {
      return res.status(400).json({
        success: false,
        message: 'chapterId and volunteerId are required.'
      });
    }

    // 1. Verify chapter exists
    const chapter = await Chapter.findById(chapterId);
    if (!chapter) {
      return res.status(404).json({
        success: false,
        message: 'Chapter not found.'
      });
    }

    // 2. Verify volunteer exists and is active volunteer
    const volunteer = await User.findById(volunteerId);
    if (!volunteer) {
      return res.status(404).json({
        success: false,
        message: 'Volunteer user not found.'
      });
    }

    const assignedStage = stage || chapter.status;

    // 3. Prevent multiple active volunteers on the same stage at once
    const activeExisting = await Assignment.findOne({
      chapterId: chapter._id,
      stage: assignedStage,
      status: 'ACTIVE'
    }).populate('volunteerId', 'name email');

    if (activeExisting) {
      if (activeExisting.volunteerId._id.toString() !== volunteerId.toString()) {
        return res.status(400).json({
          success: false,
          message: `Cannot assign: Chapter already has an active volunteer (${activeExisting.volunteerId.name}) assigned to stage '${assignedStage}'. Mark it complete or cancel it first.`
        });
      }
      // If already assigned to the same volunteer, return active assignment
      return res.status(200).json({
        success: true,
        message: 'Volunteer is already actively assigned to this chapter stage.',
        assignment: activeExisting
      });
    }

    // 4. Create new assignment record
    const assignment = await Assignment.create({
      chapterId: chapter._id,
      textbookId: chapter.textbookId,
      volunteerId: volunteer._id,
      stage: assignedStage,
      assignedBy: req.user._id,
      notes: notes || '',
      status: 'ACTIVE'
    });

    // 5. Update assignedVolunteer on chapter
    chapter.assignedVolunteer = volunteer._id;
    await chapter.save();

    // 6. Stage history audit
    await logStageChange(
      chapter._id,
      chapter.textbookId,
      chapter.status,
      chapter.status,
      req.user._id,
      `Assigned chapter to volunteer ${volunteer.name} (${volunteer.email}) for stage ${assignedStage}.`
    );

    const populatedAssignment = await Assignment.findById(assignment._id)
      .populate('volunteerId', 'name email role')
      .populate('chapterId', 'chapterTitle chapterNumber status')
      .populate('textbookId', 'title author subject gradeClass')
      .populate('assignedBy', 'name email');

    return res.status(201).json({
      success: true,
      message: 'Chapter successfully assigned to volunteer.',
      assignment: populatedAssignment
    });
  } catch (error) {
    console.error('[assignmentController.createAssignment] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create assignment.',
      error: error.message
    });
  }
};

/**
 * @route   GET /api/assignments
 * @desc    Get assignments (Admin sees all; Volunteer sees their own)
 * @access  Private
 */
exports.getAssignments = async (req, res) => {
  try {
    const { status, chapterId, volunteerId } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (chapterId) filter.chapterId = chapterId;

    if (req.user.role === 'volunteer') {
      // Volunteer sees strictly their own assignments
      filter.volunteerId = req.user._id;
    } else if (volunteerId) {
      // Admin filtering by volunteer
      filter.volunteerId = volunteerId;
    }

    const assignments = await Assignment.find(filter)
      .populate('volunteerId', 'name email role')
      .populate('chapterId', 'chapterTitle chapterNumber status sourceText brailleText brailleGrade')
      .populate('textbookId', 'title author subject gradeClass')
      .populate('assignedBy', 'name email')
      .sort({ assignedDate: -1 });

    return res.status(200).json({
      success: true,
      count: assignments.length,
      assignments
    });
  } catch (error) {
    console.error('[assignmentController.getAssignments] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve assignments.',
      error: error.message
    });
  }
};

/**
 * @route   PUT /api/assignments/:id/complete
 * @desc    Mark an assignment as completed
 * @access  Private (Admin or assigned Volunteer)
 */
exports.completeAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found.'
      });
    }

    assignment.status = 'COMPLETED';
    assignment.completionDate = new Date();
    await assignment.save();

    return res.status(200).json({
      success: true,
      message: 'Assignment marked as completed.',
      assignment
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to complete assignment.',
      error: error.message
    });
  }
};
