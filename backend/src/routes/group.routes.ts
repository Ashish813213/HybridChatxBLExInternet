import { Router } from 'express';
import { createGroup, getGroupMessages, addGroupMember, getAllGroups } from '../controllers/group.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/', authMiddleware, getAllGroups);
router.post('/', authMiddleware, createGroup);
router.get('/:id/messages', authMiddleware, getGroupMessages);
router.post('/:id/members', authMiddleware, addGroupMember);

export default router;