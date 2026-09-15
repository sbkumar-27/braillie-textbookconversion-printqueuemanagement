/**
 * services/auditLogger.js
 * 
 * Centralized service to log stage transitions in StageHistory.
 */

const StageHistory = require('../models/StageHistory');

/**
 * Log a stage change for a chapter.
 * @param {string|ObjectId} chapterId
 * @param {string|ObjectId} textbookId
 * @param {string} previousStage
 * @param {string} newStage
 * @param {string|ObjectId} changedBy - User ID
 * @param {string} [note=''] - Optional description or reason
 */
const logStageChange = async (
  chapterId,
  textbookId,
  previousStage,
  newStage,
  changedBy,
  note = ''
) => {
  try {
    const historyEntry = await StageHistory.create({
      chapterId,
      textbookId,
      previousStage,
      newStage,
      changedBy,
      note,
      timestamp: new Date()
    });
    return historyEntry;
  } catch (error) {
    console.error('[auditLogger] Failed to log stage change:', error.message);
    // We log the error but don't crash the calling request
    return null;
  }
};

module.exports = {
  logStageChange
};
