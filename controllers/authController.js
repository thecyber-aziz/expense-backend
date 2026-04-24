import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import admin from '../config/firebase.js';

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields',
      });
    }

    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({
        success: false,
        message: 'User already exists',
      });
    }

    // Create user
    user = await User.create({
      name,
      email,
      password,
    });

    // Create token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      data: {
        _id: user._id,
        id: user._id,
        name: user.name,
        email: user.email,
        theme: user.theme,
      },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      });
    }

    // Check for user
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Create token
    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      token,
      data: {
        _id: user._id,
        id: user._id,
        name: user.name,
        email: user.email,
        theme: user.theme,
      },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Update user theme
// @route   PUT /api/auth/theme
// @access  Private
export const updateTheme = async (req, res, next) => {
  try {
    const { theme } = req.body;

    if (!['light', 'dark'].includes(theme)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid theme. Must be light or dark',
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { theme },
      { new: true }
    );

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Google Sign-In
// @route   POST /api/auth/google
// @access  Public
export const googleAuth = async (req, res, next) => {
  try {
    const { firebaseToken } = req.body;

    console.log('📡 Google Auth Request received');

    if (!firebaseToken) {
      console.error('❌ No Firebase token provided');
      return res.status(400).json({
        success: false,
        message: 'Firebase token is required',
      });
    }

    console.log('🔍 Checking Firebase Admin SDK...');
    // Check if Firebase Admin SDK is initialized
    if (!admin.apps.length) {
      console.error('❌ Firebase Admin SDK is not initialized');
      return res.status(500).json({
        success: false,
        message: 'Firebase is not configured. Check FIREBASE_SERVICE_ACCOUNT in .env',
      });
    }

    console.log('✅ Firebase Admin SDK is initialized');
    console.log('🔐 Verifying Firebase token...');

    // Verify Firebase token
    let decodedToken;
    try {
      decodedToken = await admin.auth().verifyIdToken(firebaseToken);
      console.log('✅ Token verified successfully');
    } catch (tokenError) {
      console.error('❌ Token verification failed:', tokenError.message);
      return res.status(401).json({
        success: false,
        message: 'Invalid Firebase token: ' + tokenError.message,
      });
    }

    const { email, name, uid } = decodedToken;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email not provided by Google',
      });
    }

    // Check if user exists
    let user = await User.findOne({ email });

    if (!user) {
      // Create new user if doesn't exist
      user = await User.create({
        name: name || email.split('@')[0],
        email,
        firebaseUid: uid,
        password: Math.random().toString(36).slice(-16), // Random password
      });
      console.log('✅ New user created via Google auth:', email);
    } else if (!user.firebaseUid) {
      // Update existing user with Firebase UID
      user.firebaseUid = uid;
      await user.save();
      console.log('✅ Existing user linked with Firebase UID:', email);
    }

    // Create JWT token
    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      token,
      data: {
        _id: user._id,
        id: user._id,
        name: user.name,
        email: user.email,
        theme: user.theme,
      },
    });
  } catch (error) {
    console.error('❌ Google Auth Error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Google authentication failed',
    });
  }
};

// @desc    Update user notifications
// @route   PUT /api/auth/notifications
// @access  Private
export const updateNotifications = async (req, res, next) => {
  try {
    const { expenseAlerts, weeklySummary, budgetWarnings } = req.body;

    // Validate input
    if (
      expenseAlerts === undefined ||
      weeklySummary === undefined ||
      budgetWarnings === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all notification preferences',
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        notifications: {
          expenseAlerts,
          weeklySummary,
          budgetWarnings,
        },
      },
      { new: true }
    );

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Change user password
// @route   PUT /api/auth/change-password
// @access  Private
export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide current password, new password, and confirmation',
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'New passwords do not match',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters',
      });
    }

    // Get user with password field
    const user = await User.findById(req.user.id).select('+password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Check if current password matches
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect',
      });
    }

    // Update password (will be hashed by pre-save hook)
    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Update app lock settings
// @route   PUT /api/auth/app-lock
// @access  Private
export const updateAppLock = async (req, res, next) => {
  try {
    const { enabled, pin } = req.body;

    // Validation
    if (enabled === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Please provide enabled status',
      });
    }

    // If enabling, PIN must be provided
    if (enabled && !pin) {
      return res.status(400).json({
        success: false,
        message: 'PIN is required when enabling app lock',
      });
    }

    // Validate PIN length
    if (enabled && (pin.length < 4 || pin.length > 6)) {
      return res.status(400).json({
        success: false,
        message: 'PIN must be between 4 and 6 digits',
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        appLock: {
          enabled,
          pin: enabled ? pin : null,
        },
      },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: enabled ? 'App lock enabled' : 'App lock disabled',
      data: user,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Update two-factor authentication
// @route   PUT /api/auth/2fa
// @access  Private
export const update2FA = async (req, res, next) => {
  try {
    const { enabled } = req.body;

    // Validation
    if (enabled === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Please provide 2FA status',
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        twoFA: {
          enabled,
          secret: enabled ? null : null, // In production, you'd generate a secret using a library like speakeasy
        },
      },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: enabled ? 'Two-Factor Auth enabled' : 'Two-Factor Auth disabled',
      data: user,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};
