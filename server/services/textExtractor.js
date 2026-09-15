/**
 * services/textExtractor.js
 * 
 * Extracts raw textual content from uploaded source documents.
 * Supports:
 *   - .txt  (Node.js native fs module)
 *   - .pdf  (pdf-parse library for text-based PDFs)
 *   - .docx (mammoth library for Microsoft Word documents)
 * 
 * Note: OCR for scanned images/flat PDFs is not claimed nor implemented in v1.
 */

const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

/**
 * Extract text from a document file on disk.
 * @param {string} filePath - Absolute path to file
 * @param {string} fileExtension - e.g. '.txt', '.pdf', '.docx'
 * @returns {Promise<string>} Cleaned extracted text
 */
const extractText = async (filePath, fileExtension) => {
  const ext = fileExtension.toLowerCase().replace('.', '');
  let rawText = '';

  switch (ext) {
    case 'txt': {
      rawText = await fs.promises.readFile(filePath, 'utf-8');
      break;
    }

    case 'pdf': {
      const dataBuffer = await fs.promises.readFile(filePath);
      const pdfData = await pdfParse(dataBuffer);
      rawText = pdfData.text;
      break;
    }

    case 'docx': {
      const result = await mammoth.extractRawText({ path: filePath });
      rawText = result.value;
      break;
    }

    default:
      throw new Error(`Unsupported document format: .${ext}`);
  }

  // Validate extracted text
  const cleanedText = rawText.trim();
  if (!cleanedText) {
    throw new Error(
      'The uploaded document contains no readable text. If this is a PDF, ensure it contains digital text and is not a scanned image.'
    );
  }

  return cleanedText;
};

module.exports = {
  extractText
};
