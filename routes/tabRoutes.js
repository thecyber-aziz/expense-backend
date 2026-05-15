import express from 'express';
import {
  getTabs,
  createTab,
  updateTab,
  deleteTab,
  updateBalance,
  getBalance,
  syncTabs,
} from '../controllers/tabController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All routes need authentication
router.use(protect);

router.get('/', getTabs);
router.post('/', createTab);
router.post('/sync', syncTabs);
router.get('/:tabId/balance', getBalance);
router.put('/:tabId', updateTab);
router.put('/:tabId/balance', updateBalance);
router.delete('/:tabId', deleteTab);

export default router;
