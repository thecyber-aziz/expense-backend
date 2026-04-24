import mongoose from 'mongoose';
import bcryptjs from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a name'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Please add an email'],
      unique: true,
      lowercase: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        'Please add a valid email address',
      ],
    },
    password: {
      type: String,
      required: [true, 'Please add a password'],
      minlength: 6,
      select: false,
    },
    firebaseUid: {
      type: String,
      unique: true,
      sparse: true,
    },
    theme: {
      type: String,
      enum: ['light', 'dark'],
      default: 'light',
    },
    notifications: {
      expenseAlerts: {
        type: Boolean,
        default: true,
      },
      weeklySummary: {
        type: Boolean,
        default: false,
      },
      budgetWarnings: {
        type: Boolean,
        default: true,
      },
    },
    appLock: {
      enabled: {
        type: Boolean,
        default: false,
      },
      pin: {
        type: String,
        default: null,
      },
    },
    twoFA: {
      enabled: {
        type: Boolean,
        default: false,
      },
      secret: {
        type: String,
        default: null,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }

  const salt = await bcryptjs.genSalt(10);
  this.password = await bcryptjs.hash(this.password, salt);
});

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcryptjs.compare(enteredPassword, this.password);
};

export default mongoose.model('User', userSchema);
