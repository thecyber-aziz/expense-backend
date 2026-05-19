import express from 'express';
import { addBalance, getBalance, updateBalance, deleteBalance } from '../controllers/balanceController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All routes need authentication
router.use(protect);

router.post('/:tabId/add', addBalance);
router.get('/:tabId', getBalance);
router.put('/:entryId', updateBalance);
router.delete('/:entryId', deleteBalance);

export default router;
