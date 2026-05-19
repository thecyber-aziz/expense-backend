import User from '../models/User.js';
import BalanceHistory from '../models/BalanceHistory.js';

// @desc    Add balance to a tab
// @route   POST /api/balance/:tabId/add
// @access  Private
export const addBalance = async (req, res) => {
  try {
    const { tabId } = req.params;
    const { cashAmount, onlineAmount, note } = req.body;
    const userId = req.user.id;

    // Validate amounts
    if (!cashAmount && !onlineAmount) {
      return res.status(400).json({
        success: false,
        message: 'Please provide at least one amount (cash or online)',
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const tab = user.tabs.find(t => t.tabId === tabId);
    if (!tab) {
      return res.status(404).json({ success: false, message: 'Tab not found' });
    }

    // Update balance in user.tabs
    tab.cashBalance = (tab.cashBalance || 0) + (cashAmount || 0);
    tab.onlineBalance = (tab.onlineBalance || 0) + (onlineAmount || 0);
    await user.save();

    // Create balance history entry
    const balanceEntry = await BalanceHistory.create({
      userId,
      tabId,
      cashAmount: cashAmount || 0,
      onlineAmount: onlineAmount || 0,
      note,
    });

    res.status(201).json({
      success: true,
      message: 'Balance added successfully',
      data: {
        _id: balanceEntry._id,
        tabId,
        cashAmount,
        onlineAmount,
        note,
        cashBalance: tab.cashBalance,
        onlineBalance: tab.onlineBalance,
        createdAt: balanceEntry.createdAt,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get balance for a tab
// @route   GET /api/balance/:tabId
// @access  Private
export const getBalance = async (req, res) => {
  try {
    const { tabId } = req.params;
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const tab = user.tabs.find(t => t.tabId === tabId);
    if (!tab) {
      return res.status(404).json({ success: false, message: 'Tab not found' });
    }

    // Get balance history for this tab
    const history = await BalanceHistory.find({
      userId,
      tabId,
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: {
        tabId,
        cashBalance: tab.cashBalance || 0,
        onlineBalance: tab.onlineBalance || 0,
        history,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update balance entry
// @route   PUT /api/balance/:entryId
// @access  Private
export const updateBalance = async (req, res) => {
  try {
    const { entryId } = req.params;
    const { cashAmount, onlineAmount } = req.body;
    const userId = req.user.id;

    // Find the balance history entry
    const balanceEntry = await BalanceHistory.findById(entryId);
    if (!balanceEntry) {
      return res.status(404).json({
        success: false,
        message: 'Balance entry not found',
      });
    }

    // Check if user owns this entry
    if (balanceEntry.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this entry',
      });
    }

    // Calculate the difference
    const cashDiff = (cashAmount || 0) - (balanceEntry.cashAmount || 0);
    const onlineDiff = (onlineAmount || 0) - (balanceEntry.onlineAmount || 0);

    // Update the entry
    balanceEntry.cashAmount = cashAmount || 0;
    balanceEntry.onlineAmount = onlineAmount || 0;
    await balanceEntry.save();

    // Update user's tab balance
    const user = await User.findById(userId);
    const tab = user.tabs.find(t => t.tabId === balanceEntry.tabId);
    if (tab) {
      tab.cashBalance = (tab.cashBalance || 0) + cashDiff;
      tab.onlineBalance = (tab.onlineBalance || 0) + onlineDiff;
      await user.save();
    }

    res.status(200).json({
      success: true,
      message: 'Balance entry updated successfully',
      data: balanceEntry,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete balance entry
// @route   DELETE /api/balance/:entryId
// @access  Private
export const deleteBalance = async (req, res) => {
  try {
    const { entryId } = req.params;
    const userId = req.user.id;

    // Find and delete the balance history entry
    const balanceEntry = await BalanceHistory.findById(entryId);
    if (!balanceEntry) {
      return res.status(404).json({
        success: false,
        message: 'Balance entry not found',
      });
    }

    // Check if user owns this entry
    if (balanceEntry.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this entry',
      });
    }

    // Update user's tab balance (reverse the amounts)
    const user = await User.findById(userId);
    const tab = user.tabs.find(t => t.tabId === balanceEntry.tabId);
    if (tab) {
      tab.cashBalance = (tab.cashBalance || 0) - (balanceEntry.cashAmount || 0);
      tab.onlineBalance = (tab.onlineBalance || 0) - (balanceEntry.onlineAmount || 0);
      await user.save();
    }

    // Delete the entry
    await BalanceHistory.findByIdAndDelete(entryId);

    res.status(200).json({
      success: true,
      message: 'Balance entry deleted successfully',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
