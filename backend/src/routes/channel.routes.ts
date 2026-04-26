import { Router } from 'express';
import { createChannel, subscribeChannel, getChannelMessages, getAllChannels, reactToChannelMessage } from '../controllers/channel.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/', authMiddleware, getAllChannels);
router.post('/', authMiddleware, createChannel);
router.post('/:id/subscribe', authMiddleware, subscribeChannel);
router.post('/:id/messages/:messageId/react', authMiddleware, reactToChannelMessage);
router.get('/:id/messages', authMiddleware, getChannelMessages);

export default router;