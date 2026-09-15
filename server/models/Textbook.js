/**
 * models/Textbook.js
 * 
 * Represents a school textbook in the library catalog.
 * A textbook contains multiple chapters undergoing conversion.
 */

const mongoose = require('mongoose');

const textbookSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide the textbook title'],
      trim: true
    },
    author: {
      type: String,
      required: [true, 'Please provide the author name'],
      trim: true
    },
    subject: {
      type: String,
      required: [true, 'Please provide the subject (e.g., Science, English)'],
      trim: true
    },
    gradeClass: {
      type: String,
      required: [true, 'Please provide the class or grade level (e.g., Grade 5, Grade 10)'],
      trim: true
    },
    publisher: {
      type: String,
      trim: true,
      default: ''
    },
    description: {
      type: String,
      trim: true,
      default: ''
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Textbook', textbookSchema);
