import Expense from '../models/Expense.js';
import User from '../models/User.js';

// @desc    Get all expenses for a user (with optional tab filter)
// @route   GET /api/expenses
// @access  Private
export const getExpenses = async (req, res, next) => {
  try {
    const { month, year, category, tabId } = req.query;
    let filter = { userId: req.user.id };

    if (tabId) {
      filter.tabId = tabId;
    }

    if (month && year) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);
      filter.date = { $gte: startDate, $lte: endDate };
    }

    if (category) {
      filter.category = category;
    }

    const expenses = await Expense.find(filter).sort({ createdAt: -1, date: -1 });

    res.status(200).json({
      success: true,
      count: expenses.length,
      data: expenses,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get a single expense
// @route   GET /api/expenses/:id
// @access  Private
export const getExpense = async (req, res, next) => {
  try {
    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found',
      });
    }

    if (expense.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this expense',
      });
    }

    res.status(200).json({
      success: true,
      data: expense,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Create new expense
// @route   POST /api/expenses
// @access  Private
export const createExpense = async (req, res, next) => {
  try {
    const { name, description, amount, category, date, notes, paymentMethod, tabId } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Please add an expense name',
      });
    }

    if (!tabId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a tab ID',
      });
    }

    // Create the expense
    const expenseData = {
      userId: req.user.id,
      tabId,
      name,
      amount,
      category,
      date,
      notes,
      paymentMethod: paymentMethod || 'Cash',
    };
    
    // Only include description if provided
    if (description && description.trim()) {
      expenseData.description = description.trim();
    }
    
    const expense = await Expense.create(expenseData);

    // Update user tab balance based on payment method
    const user = await User.findById(req.user.id);
    const tabIndex = user.tabs.findIndex(t => t.tabId === tabId);
    
    if (tabIndex !== -1) {
      if (paymentMethod === 'Online') {
        user.tabs[tabIndex].onlineBalance -= amount;
      } else {
        user.tabs[tabIndex].cashBalance -= amount;
      }
      await user.save();
    }

    res.status(201).json({
      success: true,
      data: expense,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Update expense
// @route   PUT /api/expenses/:id
// @access  Private
export const updateExpense = async (req, res, next) => {
  try {
    let expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found',
      });
    }

    if (expense.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this expense',
      });
    }

    const oldAmount = expense.amount;
    const oldPaymentMethod = expense.paymentMethod;
    const newAmount = req.body.amount || oldAmount;
    const newPaymentMethod = req.body.paymentMethod || oldPaymentMethod;

    // Prepare update data
    const updateData = { ...req.body };
    
    // Only include description if provided
    if (updateData.description && !updateData.description.trim()) {
      delete updateData.description;
    } else if (updateData.description) {
      updateData.description = updateData.description.trim();
    }
    
    // Update the expense
    expense = await Expense.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

    // Update user tab balance if amount or payment method changed
    if (oldAmount !== newAmount || oldPaymentMethod !== newPaymentMethod) {
      const user = await User.findById(req.user.id);
      const tabIndex = user.tabs.findIndex(t => t.tabId === expense.tabId);
      
      if (tabIndex !== -1) {
        // Reverse old deduction
        if (oldPaymentMethod === 'Online') {
          user.tabs[tabIndex].onlineBalance += oldAmount;
        } else {
          user.tabs[tabIndex].cashBalance += oldAmount;
        }

        // Apply new deduction
        if (newPaymentMethod === 'Online') {
          user.tabs[tabIndex].onlineBalance -= newAmount;
        } else {
          user.tabs[tabIndex].cashBalance -= newAmount;
        }
        await user.save();
      }
    }

    res.status(200).json({
      success: true,
      data: expense,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Delete expense
// @route   DELETE /api/expenses/:id
// @access  Private
export const deleteExpense = async (req, res, next) => {
  try {
    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found',
      });
    }

    if (expense.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this expense',
      });
    }

    // Refund the amount to the correct balance
    const user = await User.findById(req.user.id);
    const tabIndex = user.tabs.findIndex(t => t.tabId === expense.tabId);
    
    if (tabIndex !== -1) {
      if (expense.paymentMethod === 'Online') {
        user.tabs[tabIndex].onlineBalance += expense.amount;
      } else {
        user.tabs[tabIndex].cashBalance += expense.amount;
      }
      await user.save();
    }

    await Expense.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Expense deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get expense statistics
// @route   GET /api/expenses/stats/summary
// @access  Private
export const getExpenseStats = async (req, res, next) => {
  try {
    const { month, year, tabId } = req.query;
    let filter = { userId: req.user.id };

    if (tabId) {
      filter.tabId = tabId;
    }

    if (month && year) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);
      filter.date = { $gte: startDate, $lte: endDate };
    }

    const stats = await Expense.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { total: -1 } },
    ]);

    const totalExpenses = await Expense.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: {
        stats,
        totalAmount: totalExpenses[0]?.total || 0,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
