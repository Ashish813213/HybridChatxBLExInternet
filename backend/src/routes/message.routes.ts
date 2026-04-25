import { Router } from 'express';
import { sendMessage, syncMessages, logBluetoothMessage, getNearbyUsers, searchUsers, getConversations } from '../controllers/message.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/search', authMiddleware, searchUsers);
router.get('/conversations', authMiddleware, getConversations);
router.post('/send', authMiddleware, sendMessage);
router.get('/sync', authMiddleware, syncMessages);
router.post('/bluetooth', authMiddleware, logBluetoothMessage);
router.get('/nearby', authMiddleware, getNearbyUsers);

export default router;