/**
 * models/PrintQueue.js
 * 
 * Manages print / embossing queue jobs for approved chapters.
 * Chapters enter this queue only after human proofreader approval.
 */

const mongoose = require('mongoose');

const printQueueSchema = new mongoose.Schema(
  {
    chapterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Chapter',
      required: true
    },
    textbookId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Textbook',
      required: true
    },
    queuePosition: {
      type: Number,
      required: true
    },
    brailleSummary: {
      charCount: { type: Number, default: 0 },
      estimatedPages: { type: Number, default: 1 }
    },
    status: {
      type: String,
      enum: ['QUEUED', 'PRINTING', 'COMPLETED', 'CANCELLED'],
      default: 'QUEUED'
    },
    sheetsConsumed: {
      type: Number,
      default: 0
    },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    completedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    completedDate: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('PrintQueue', printQueueSchema);
