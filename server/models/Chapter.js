/**
 * models/Chapter.js
 * 
 * Represents a single chapter belonging to a textbook.
 * Tracks its conversion pipeline status, source extracted text,
 * generated Unicode Braille, assigned volunteer, and braille grade.
 */

const mongoose = require('mongoose');

const chapterSchema = new mongoose.Schema(
  {
    textbookId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Textbook',
      required: [true, 'A chapter must belong to a textbook']
    },
    chapterNumber: {
      type: Number,
      required: [true, 'Please provide the chapter number']
    },
    chapterTitle: {
      type: String,
      required: [true, 'Please provide the chapter title'],
      trim: true
    },
    status: {
      type: String,
      enum: [
        'PENDING',
        'TEXT_EXTRACTION',
        'BRAILLE_TRANSLATION',
        'PROOFREADING',
        'EMBOSSING',
        'DONE'
      ],
      default: 'PENDING'
    },
    assignedVolunteer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    sourceText: {
      type: String,
      default: ''
    },
    brailleText: {
      type: String,
      default: ''
    },
    brailleGrade: {
      type: String,
      enum: ['GRADE_1', 'GRADE_2'],
      default: 'GRADE_1'
    },
    pageCount: {
      type: Number,
      default: 1
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Chapter', chapterSchema);
