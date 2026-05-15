import User from '../models/User.js';
import Expense from '../models/Expense.js';

// @desc    Get all tabs for a user
// @route   GET /api/tabs
// @access  Private
export const getTabs = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      data: user.tabs || [],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Create a new tab
// @route   POST /api/tabs
// @access  Private
export const createTab = async (req, res, next) => {
  try {
    const { tabId, name } = req.body;

    if (!tabId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a tab ID',
      });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Check if tab already exists
    const tabExists = user.tabs.some(t => t.tabId === tabId);
    if (tabExists) {
      return res.status(400).json({
        success: false,
        message: 'Tab already exists',
      });
    }

    const newTab = {
      tabId,
      name: name || `Tab ${user.tabs.length + 1}`,
      cashBalance: 0,
      onlineBalance: 0,
    };

    user.tabs.push(newTab);
    await user.save();

    res.status(201).json({
      success: true,
      data: newTab,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Update tab name
// @route   PUT /api/tabs/:tabId
// @access  Private
export const updateTab = async (req, res, next) => {
  try {
    const { tabId } = req.params;
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a name',
      });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const tab = user.tabs.find(t => t.tabId === tabId);

    if (!tab) {
      return res.status(404).json({
        success: false,
        message: 'Tab not found',
      });
    }

    tab.name = name;
    await user.save();

    res.status(200).json({
      success: true,
      data: tab,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Delete a tab
// @route   DELETE /api/tabs/:tabId
// @access  Private
export const deleteTab = async (req, res, next) => {
  try {
    const { tabId } = req.params;

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const tabIndex = user.tabs.findIndex(t => t.tabId === tabId);

    if (tabIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Tab not found',
      });
    }

    if (user.tabs.length === 1) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete the last tab',
      });
    }

    // Delete associated expenses
    await Expense.deleteMany({ userId: req.user.id, tabId });

    user.tabs.splice(tabIndex, 1);
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Tab deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Update balance for a tab
// @route   PUT /api/tabs/:tabId/balance
// @access  Private
export const updateBalance = async (req, res, next) => {
  try {
    const { tabId } = req.params;
    const { cashBalance, onlineBalance } = req.body;

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const tab = user.tabs.find(t => t.tabId === tabId);

    if (!tab) {
      return res.status(404).json({
        success: false,
        message: 'Tab not found',
      });
    }

    if (cashBalance !== undefined) {
      tab.cashBalance = cashBalance;
    }

    if (onlineBalance !== undefined) {
      tab.onlineBalance = onlineBalance;
    }

    await user.save();

    res.status(200).json({
      success: true,
      data: tab,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get balance for a tab
// @route   GET /api/tabs/:tabId/balance
// @access  Private
export const getBalance = async (req, res, next) => {
  try {
    const { tabId } = req.params;

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const tab = user.tabs.find(t => t.tabId === tabId);

    if (!tab) {
      return res.status(404).json({
        success: false,
        message: 'Tab not found',
      });
    }

    res.status(200).json({
      success: true,
      data: {
        tabId,
        cashBalance: tab.cashBalance,
        onlineBalance: tab.onlineBalance,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Sync initial tabs from frontend localStorage
// @route   POST /api/tabs/sync
// @access  Private
export const syncTabs = async (req, res, next) => {
  try {
    const { tabs } = req.body;

    if (!Array.isArray(tabs)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of tabs',
      });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Update existing tabs and add new ones
    tabs.forEach(newTab => {
      const existingTab = user.tabs.find(t => t.tabId === newTab.tabId);
      if (existingTab) {
        existingTab.name = newTab.name || existingTab.name;
        if (newTab.cashBalance !== undefined) {
          existingTab.cashBalance = newTab.cashBalance;
        }
        if (newTab.onlineBalance !== undefined) {
          existingTab.onlineBalance = newTab.onlineBalance;
        }
      } else {
        user.tabs.push({
          tabId: newTab.tabId,
          name: newTab.name || `Tab ${user.tabs.length + 1}`,
          cashBalance: newTab.cashBalance || 0,
          onlineBalance: newTab.onlineBalance || 0,
        });
      }
    });

    await user.save();

    res.status(200).json({
      success: true,
      data: user.tabs,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};
