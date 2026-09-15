/**
 * models/Document.js
 * 
 * Stores metadata for source documents (.txt, .pdf, .docx) uploaded for chapter conversion.
 * File bytes are stored locally on disk in /uploads; MongoDB only stores the storageKey and metadata.
 */

const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema(
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
    filename: {
      type: String,
      required: true
    },
    originalName: {
      type: String,
      required: true
    },
    fileType: {
      type: String,
      enum: ['txt', 'pdf', 'docx'],
      required: true
    },
    mimeType: {
      type: String,
      required: true
    },
    storageKey: {
      type: String,
      required: true // e.g. 'uploads/1694784000-chapter1.docx'
    },
    fileSize: {
      type: Number,
      required: true
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    extractedLength: {
      type: Number,
      default: 0
    },
    uploadDate: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Document', documentSchema);
