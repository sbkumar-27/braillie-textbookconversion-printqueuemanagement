/**
 * models/StageHistory.js
 * 
 * Comprehensive audit trail recording every state transition for every chapter.
 * Answers the question: "What happened to this chapter?" end-to-end.
 */

const mongoose = require('mongoose');

const stageHistorySchema = new mongoose.Schema(
  {
    chapterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Chapter',
      required: true,
      index: true
    },
    textbookId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Textbook',
      required: true
    },
    previousStage: {
      type: String,
      required: true
    },
    newStage: {
      type: String,
      required: true
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    note: {
      type: String,
      default: ''
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: false // Using explicit timestamp field
  }
);

module.exports = mongoose.model('StageHistory', stageHistorySchema);
