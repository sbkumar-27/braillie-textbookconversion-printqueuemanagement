/**
 * scripts/seed.js
 * 
 * Populates MongoDB Atlas with demo accounts, sample textbooks, chapters,
 * assignments, and print queue entries for viva demonstration.
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const Textbook = require('../models/Textbook');
const Chapter = require('../models/Chapter');
const Assignment = require('../models/Assignment');
const PrintQueue = require('../models/PrintQueue');
const Inventory = require('../models/Inventory');
const StageHistory = require('../models/StageHistory');
const { convertToBraille } = require('../services/brailleConverter');

const seedDatabase = async () => {
  try {
    console.log('[Seed] Connecting to MongoDB Atlas...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('[Seed] Connected successfully.');

    // Clear existing collections
    console.log('[Seed] Clearing old data...');
    await Promise.all([
      User.deleteMany({}),
      Textbook.deleteMany({}),
      Chapter.deleteMany({}),
      Assignment.deleteMany({}),
      PrintQueue.deleteMany({}),
      Inventory.deleteMany({}),
      StageHistory.deleteMany({})
    ]);

    // 1. Create Demo Users
    console.log('[Seed] Creating demo accounts...');
    const adminUser = await User.create({
      name: 'Eleanor Vance',
      email: 'admin@braillie.lib',
      password: 'Admin@1234',
      role: 'admin'
    });

    const volunteerUser = await User.create({
      name: 'Marcus Chen',
      email: 'volunteer@braillie.lib',
      password: 'Volunteer@1234',
      role: 'volunteer'
    });

    // 2. Initialize Paper Inventory
    console.log('[Seed] Initializing paper inventory...');
    const inventory = await Inventory.create({
      currentStock: 480,
      minReorderLevel: 100,
      paperType: 'Standard Heavyweight Braille Paper (150 GSM)',
      transactions: [
        {
          type: 'ADD',
          quantity: 500,
          reason: 'Initial library stock allocation for school semester',
          recordedBy: adminUser._id,
          date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        },
        {
          type: 'CONSUMED',
          quantity: 20,
          reason: 'Embossed sample chapters',
          recordedBy: adminUser._id,
          date: new Date()
        }
      ]
    });

    // 3. Create Sample Textbook 1: Science
    console.log('[Seed] Creating sample textbooks & chapters...');
    const scienceBook = await Textbook.create({
      title: 'Foundations of General Science',
      author: 'Dr. Arthur Bennett',
      subject: 'Science',
      gradeClass: 'Grade 6',
      publisher: 'Cambridge Educational',
      description: 'Introductory life sciences and biology for middle school visually impaired students.',
      createdBy: adminUser._id
    });

    const ch1Source = `Living organisms share fundamental characteristics. Every living creature requires energy, responds to environmental stimuli, grows over time, and reproduces. 

In 1665, scientist Robert Hooke observed thin slices of cork under a microscope and discovered tiny box-like chambers that he named cells. Cells are the fundamental building blocks of all living things. Some organisms consist of a single cell, while complex organisms like human beings contain trillions of specialized cells working together in harmony.`;

    const ch1Braille = convertToBraille(ch1Source, 'GRADE_2');

    const ch1 = await Chapter.create({
      textbookId: scienceBook._id,
      chapterNumber: 1,
      chapterTitle: 'Characteristics of Living Things',
      status: 'PROOFREADING',
      assignedVolunteer: volunteerUser._id,
      sourceText: ch1Source,
      brailleText: ch1Braille,
      brailleGrade: 'GRADE_2',
      pageCount: Math.max(1, Math.ceil(ch1Braille.length / 1000))
    });

    // Audit logs for Ch 1
    await StageHistory.create([
      {
        chapterId: ch1._id,
        textbookId: scienceBook._id,
        previousStage: 'NONE',
        newStage: 'PENDING',
        changedBy: adminUser._id,
        note: 'Textbook chapter initialized',
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
      },
      {
        chapterId: ch1._id,
        textbookId: scienceBook._id,
        previousStage: 'PENDING',
        newStage: 'TEXT_EXTRACTION',
        changedBy: volunteerUser._id,
        note: 'Uploaded and extracted document: biology_ch1.docx',
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
      },
      {
        chapterId: ch1._id,
        textbookId: scienceBook._id,
        previousStage: 'TEXT_EXTRACTION',
        newStage: 'BRAILLE_TRANSLATION',
        changedBy: volunteerUser._id,
        note: 'Automated conversion executed using Grade 2 Braille',
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
      },
      {
        chapterId: ch1._id,
        textbookId: scienceBook._id,
        previousStage: 'BRAILLE_TRANSLATION',
        newStage: 'PROOFREADING',
        changedBy: volunteerUser._id,
        note: 'Volunteer opened workbench and refined text formatting',
        timestamp: new Date()
      }
    ]);

    // Active assignment for Ch 1
    await Assignment.create({
      chapterId: ch1._id,
      textbookId: scienceBook._id,
      volunteerId: volunteerUser._id,
      stage: 'PROOFREADING',
      assignedBy: adminUser._id,
      notes: 'Please verify scientific terminology and numbers.',
      status: 'ACTIVE'
    });

    const ch2 = await Chapter.create({
      textbookId: scienceBook._id,
      chapterNumber: 2,
      chapterTitle: 'Plant Cells and Photosynthesis',
      status: 'TEXT_EXTRACTION',
      assignedVolunteer: volunteerUser._id,
      sourceText: 'Green plants use sunlight to synthesize nutrients from carbon dioxide and water.',
      brailleText: '',
      brailleGrade: 'GRADE_1'
    });

    const ch3 = await Chapter.create({
      textbookId: scienceBook._id,
      chapterNumber: 3,
      chapterTitle: 'Ecosystems and Food Webs',
      status: 'PENDING'
    });

    // 4. Create Sample Textbook 2: History (with queued and completed chapters)
    const historyBook = await Textbook.create({
      title: 'World History: Ancient Civilizations',
      author: 'Prof. Margaret Hall',
      subject: 'Social Studies',
      gradeClass: 'Grade 7',
      publisher: 'National Heritage Press',
      description: 'Historical overview of Mesopotamia, Egypt, and classical antiquity.',
      createdBy: adminUser._id
    });

    const chHist1Source = 'Mesopotamia, located between the Tigris and Euphrates rivers, is often called the cradle of civilization.';
    const chHist1Braille = convertToBraille(chHist1Source, 'GRADE_2');

    const chHist1 = await Chapter.create({
      textbookId: historyBook._id,
      chapterNumber: 1,
      chapterTitle: 'Mesopotamia and the Fertile Crescent',
      status: 'EMBOSSING',
      assignedVolunteer: volunteerUser._id,
      sourceText: chHist1Source,
      brailleText: chHist1Braille,
      brailleGrade: 'GRADE_2',
      pageCount: 1
    });

    // Embossing queue item
    await PrintQueue.create({
      chapterId: chHist1._id,
      textbookId: historyBook._id,
      queuePosition: 1,
      brailleSummary: {
        charCount: chHist1Braille.length,
        estimatedPages: 1
      },
      status: 'QUEUED',
      requestedBy: volunteerUser._id
    });

    const chHist2Source = 'The Ancient Egyptians developed hieroglyphic script and built magnificent stone pyramids.';
    const chHist2Braille = convertToBraille(chHist2Source, 'GRADE_1');

    const chHist2 = await Chapter.create({
      textbookId: historyBook._id,
      chapterNumber: 2,
      chapterTitle: 'Ancient Egyptian Society & Pyramids',
      status: 'DONE',
      assignedVolunteer: volunteerUser._id,
      sourceText: chHist2Source,
      brailleText: chHist2Braille,
      brailleGrade: 'GRADE_1',
      pageCount: 2
    });

    await PrintQueue.create({
      chapterId: chHist2._id,
      textbookId: historyBook._id,
      queuePosition: 0,
      brailleSummary: {
        charCount: chHist2Braille.length,
        estimatedPages: 2
      },
      status: 'COMPLETED',
      sheetsConsumed: 2,
      requestedBy: volunteerUser._id,
      completedBy: adminUser._id,
      completedDate: new Date()
    });

    console.log('\n======================================================');
    console.log('🎉 DATABASE SEEDING COMPLETED SUCCESSFULLY!');
    console.log('======================================================');
    console.log('DEMO ACCOUNTS READY FOR LOGIN:');
    console.log('  1. Librarian (Admin):');
    console.log('     Email:    admin@braillie.lib');
    console.log('     Password: Admin@1234');
    console.log('  2. Transcriber (Volunteer):');
    console.log('     Email:    volunteer@braillie.lib');
    console.log('     Password: Volunteer@1234');
    console.log('======================================================\n');

    process.exit(0);
  } catch (error) {
    console.error('[Seed] Failed to seed database:', error);
    process.exit(1);
  }
};

seedDatabase();
