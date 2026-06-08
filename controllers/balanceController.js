import User from '../models/User.js';
import BalanceHistory from '../models/BalanceHistory.js';

export const addBalance = async (req, res) => {
  try {
    const { tabId } = req.params;
    const { cashAmount, onlineAmount, note } = req.body;
    const userId = req.user.id;

    if (!cashAmount && !onlineAmount) {
      return res.status(400).json({
        success: false,
        message: 'Please provide at least one amount (cash or online)',
      });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const tab = user.tabs.find(t => t.tabId === tabId);
    if (!tab) return res.status(404).json({ success: false, message: 'Tab not found' });

    tab.cashBalance   = (tab.cashBalance   || 0) + (cashAmount   || 0);
    tab.onlineBalance = (tab.onlineBalance || 0) + (onlineAmount || 0);
    await user.save();

    const balanceEntry = await BalanceHistory.create({
      userId,
      tabId,
      cashAmount:   cashAmount   || 0,
      onlineAmount: onlineAmount || 0,
      note,
    });

    res.status(201).json({
      success: true,
      message: 'Balance added successfully',
      data: {
        _id:           balanceEntry._id,       // ✅ _id included
        tabId,
        cashAmount:    balanceEntry.cashAmount,
        onlineAmount:  balanceEntry.onlineAmount,
        note:          balanceEntry.note,
        cashBalance:   tab.cashBalance,
        onlineBalance: tab.onlineBalance,
        createdAt:     balanceEntry.createdAt,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getBalance = async (req, res) => {
  try {
    const { tabId } = req.params;
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const tab = user.tabs.find(t => t.tabId === tabId);
    if (!tab) return res.status(404).json({ success: false, message: 'Tab not found' });

    // ✅ ascending order so frontend .reverse() shows newest first
    const history = await BalanceHistory.find({ userId, tabId }).sort({ createdAt: 1 });

    res.status(200).json({
      success: true,
      data: {
        tabId,
        cashBalance:   tab.cashBalance   || 0,
        onlineBalance: tab.onlineBalance || 0,
        history,  // ✅ each entry has _id
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateBalance = async (req, res) => {
  try {
    const { entryId } = req.params;
    const { cashAmount, onlineAmount } = req.body;
    const userId = req.user.id;

    const balanceEntry = await BalanceHistory.findById(entryId);
    if (!balanceEntry) {
      return res.status(404).json({ success: false, message: 'Balance entry not found' });
    }

    if (balanceEntry.userId.toString() !== userId) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this entry' });
    }

    const cashDiff   = (cashAmount   || 0) - (balanceEntry.cashAmount   || 0);
    const onlineDiff = (onlineAmount || 0) - (balanceEntry.onlineAmount || 0);

    balanceEntry.cashAmount   = cashAmount   || 0;
    balanceEntry.onlineAmount = onlineAmount || 0;
    await balanceEntry.save();

    const user = await User.findById(userId);
    const tab = user.tabs.find(t => t.tabId === balanceEntry.tabId);
    if (tab) {
      tab.cashBalance   = (tab.cashBalance   || 0) + cashDiff;
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

export const deleteBalance = async (req, res) => {
  try {
    const { entryId } = req.params;
    const userId = req.user.id;

    const balanceEntry = await BalanceHistory.findById(entryId);
    if (!balanceEntry) {
      return res.status(404).json({ success: false, message: 'Balance entry not found' });
    }

    if (balanceEntry.userId.toString() !== userId) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this entry' });
    }

    const user = await User.findById(userId);
    const tab = user.tabs.find(t => t.tabId === balanceEntry.tabId);
    if (tab) {
      tab.cashBalance   = (tab.cashBalance   || 0) - (balanceEntry.cashAmount   || 0);
      tab.onlineBalance = (tab.onlineBalance || 0) - (balanceEntry.onlineAmount || 0);
      await user.save();
    }

    await BalanceHistory.findByIdAndDelete(entryId);

    res.status(200).json({
      success: true,
      message: 'Balance entry deleted successfully',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};