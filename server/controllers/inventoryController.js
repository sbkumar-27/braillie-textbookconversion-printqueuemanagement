/**
 * controllers/inventoryController.js
 * 
 * Manages paper inventory tracking, adding stock, and low-stock alerts.
 */

const Inventory = require('../models/Inventory');

/**
 * @route   GET /api/inventory
 * @desc    Get current inventory status, threshold warning, and transaction history
 * @access  Private
 */
exports.getInventory = async (req, res) => {
  try {
    const inventory = await Inventory.getOrCreate(req.user._id);

    // Check if stock is at or below minimum reorder level
    const isLowStock = inventory.currentStock <= inventory.minReorderLevel;
    const warning = isLowStock
      ? `Warning: Current paper stock (${inventory.currentStock} sheets) is at or below the minimum reorder level (${inventory.minReorderLevel} sheets). Please restock soon.`
      : null;

    return res.status(200).json({
      success: true,
      inventory,
      isLowStock,
      warning
    });
  } catch (error) {
    console.error('[inventoryController.getInventory] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve inventory data.',
      error: error.message
    });
  }
};

/**
 * @route   POST /api/inventory/add-stock
 * @desc    Add paper stock to inventory
 * @access  Private (Admin only)
 */
exports.addStock = async (req, res) => {
  try {
    const { quantity, reason } = req.body;
    const qty = parseInt(quantity, 10);

    if (isNaN(qty) || qty <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid positive quantity of paper sheets to add.'
      });
    }

    const inventory = await Inventory.getOrCreate(req.user._id);

    inventory.currentStock += qty;
    inventory.transactions.push({
      type: 'ADD',
      quantity: qty,
      reason: reason || 'Manual stock replenishment',
      recordedBy: req.user._id,
      date: new Date()
    });

    await inventory.save();

    const isLowStock = inventory.currentStock <= inventory.minReorderLevel;

    return res.status(200).json({
      success: true,
      message: `Successfully added ${qty} sheets to inventory. Current stock: ${inventory.currentStock} sheets.`,
      inventory,
      isLowStock
    });
  } catch (error) {
    console.error('[inventoryController.addStock] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to add paper stock.',
      error: error.message
    });
  }
};

/**
 * @route   PUT /api/inventory/settings
 * @desc    Update minimum reorder level or paper description
 * @access  Private (Admin only)
 */
exports.updateSettings = async (req, res) => {
  try {
    const { minReorderLevel, paperType } = req.body;
    const inventory = await Inventory.getOrCreate(req.user._id);

    if (minReorderLevel !== undefined) {
      inventory.minReorderLevel = Math.max(0, parseInt(minReorderLevel, 10));
    }
    if (paperType) {
      inventory.paperType = paperType;
    }

    await inventory.save();

    return res.status(200).json({
      success: true,
      message: 'Inventory settings updated.',
      inventory
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update inventory settings.',
      error: error.message
    });
  }
};
