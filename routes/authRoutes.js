import express from 'express';
import {
  register,
  login,
  getMe,
  updateTheme,
  updateNotifications,
  changePassword,
  updateAppLock,
  update2FA,
  googleAuth,
} from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/google', googleAuth);
router.get('/me', protect, getMe);
router.put('/theme', protect, updateTheme);
router.put('/notifications', protect, updateNotifications);
router.put('/change-password', protect, changePassword);
router.put('/app-lock', protect, updateAppLock);
router.put('/2fa', protect, update2FA);

export default router;
