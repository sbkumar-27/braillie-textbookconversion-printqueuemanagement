/**
 * models/Assignment.js
 * 
 * Tracks chapter assignments given by admins to volunteer transcribers.
 * Enforces rule: A chapter cannot have multiple active volunteers on the same stage at once.
 */

const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema(
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
    volunteerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    stage: {
      type: String,
      enum: [
        'PENDING',
        'TEXT_EXTRACTION',
        'BRAILLE_TRANSLATION',
        'PROOFREADING',
        'EMBOSSING',
        'DONE'
      ],
      required: true
    },
    assignedDate: {
      type: Date,
      default: Date.now
    },
    completionDate: {
      type: Date,
      default: null
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'COMPLETED', 'CANCELLED'],
      default: 'ACTIVE'
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    notes: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Assignment', assignmentSchema);
