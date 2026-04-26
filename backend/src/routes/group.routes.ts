import { Router } from 'express';
import { createGroup, getGroupMessages, addGroupMember, getAllGroups, joinGroupByCode } from '../controllers/group.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/', authMiddleware, getAllGroups);
router.post('/', authMiddleware, createGroup);
router.post('/join', authMiddleware, joinGroupByCode);
router.get('/:id/messages', authMiddleware, getGroupMessages);
router.post('/:id/members', authMiddleware, addGroupMember);

export default router;