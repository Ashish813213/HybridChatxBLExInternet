import { Router } from 'express';
import { sendMessage, syncMessages, logBluetoothMessage, getNearbyUsers, searchUsers, getConversations } from '../controllers/message.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { upload } from '../utils/cloudinary.js';

const router = Router();

router.get('/search', authMiddleware, searchUsers);
router.get('/conversations', authMiddleware, getConversations);
router.post('/send', authMiddleware, sendMessage);
router.post('/upload-image', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No image uploaded' });
      return;
    }
    const imageUrl = (req.file as any).secure_url || (req.file as any).path;
    res.json({ imageUrl, success: true });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});
router.get('/sync', authMiddleware, syncMessages);
router.post('/bluetooth', authMiddleware, logBluetoothMessage);
router.get('/nearby', authMiddleware, getNearbyUsers);

export default router;