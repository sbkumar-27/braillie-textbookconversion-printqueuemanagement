/**
 * models/Inventory.js
 * 
 * Tracks Braille paper inventory, minimum reorder thresholds,
 * and historical transactions (stock added or consumed by embossing jobs).
 */

const mongoose = require('mongoose');

const inventoryTransactionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['ADD', 'CONSUMED'],
    required: true
  },
  quantity: {
    type: Number,
    required: true
  },
  reason: {
    type: String,
    default: ''
  },
  chapterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chapter',
    default: null
  },
  printJobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PrintQueue',
    default: null
  },
  recordedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  }
});

const inventorySchema = new mongoose.Schema(
  {
    currentStock: {
      type: Number,
      required: true,
      default: 500 // Initial default stock
    },
    minReorderLevel: {
      type: Number,
      required: true,
      default: 100 // Threshold for low-stock warning
    },
    paperType: {
      type: String,
      default: 'Standard Heavyweight Braille Paper (150 GSM)'
    },
    transactions: [inventoryTransactionSchema]
  },
  {
    timestamps: true
  }
);

// Static method to get or initialize the singleton inventory record
inventorySchema.statics.getOrCreate = async function (adminUserId) {
  let inventory = await this.findOne();
  if (!inventory) {
    inventory = await this.create({
      currentStock: 500,
      minReorderLevel: 100,
      paperType: 'Standard Heavyweight Braille Paper (150 GSM)',
      transactions: [
        {
          type: 'ADD',
          quantity: 500,
          reason: 'Initial system stock initialization',
          recordedBy: adminUserId,
          date: new Date()
        }
      ]
    });
  }
  return inventory;
};

module.exports = mongoose.model('Inventory', inventorySchema);
