import mongoose from 'mongoose';

const balanceHistorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    tabId: {
      type: String,
      required: true,
    },
    cashAmount: {
      type: Number,
      default: 0,
    },
    onlineAmount: {
      type: Number,
      default: 0,
    },
    note: {
      type: String,
      trim: true,
      maxlength: [200, 'Note cannot be more than 200 characters'],
    },
    date: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('BalanceHistory', balanceHistorySchema);
