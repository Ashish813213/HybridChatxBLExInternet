import { Request, Response } from 'express';
import { Group } from '../models/Group.js';
import { Message } from '../models/Message.js';
import { Types } from 'mongoose';
import { randomBytes } from 'crypto';

const generateUniqueGroupCode = async (): Promise<string> => {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const inviteCode = randomBytes(4).toString('hex').toUpperCase();
    const exists = await Group.exists({ inviteCode });
    if (!exists) {
      return inviteCode;
    }
  }

  throw new Error('Failed to generate unique group code');
};

export const getAllGroups = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const groups = await Group.find({
      $or: [
        { adminId: new Types.ObjectId(userId) },
        { members: new Types.ObjectId(userId) },
      ],
    }).sort({ createdAt: -1 }).limit(50);

    res.json({ groups });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

export const createGroup = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, members } = req.body;
    const adminId = req.userId;

    if (!adminId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const inviteCode = await generateUniqueGroupCode();

    const group = await Group.create({
      name,
      adminId: new Types.ObjectId(adminId),
      members: members?.map((id: string) => new Types.ObjectId(id)) || [],
      inviteCode,
      createdAt: new Date(),
    });

    res.status(201).json({ group, inviteCode: group.inviteCode });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

export const joinGroupByCode = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const inviteCode = String(req.body?.code || '').trim().toUpperCase();

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    if (!inviteCode) {
      res.status(400).json({ error: 'Group code is required' });
      return;
    }

    const group = await Group.findOne({ inviteCode });
    if (!group) {
      res.status(404).json({ error: 'Invalid group code' });
      return;
    }

    const memberId = new Types.ObjectId(userId);
    const isAlreadyMember =
      group.adminId.equals(memberId) || group.members.some((id) => id.equals(memberId));

    if (!isAlreadyMember) {
      group.members.push(memberId);
      await group.save();
    }

    res.json({ group, joined: !isAlreadyMember });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

export const getGroupMessages = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const group = await Group.findById(id);
    if (!group) {
      res.status(404).json({ error: 'Group not found' });
      return;
    }

    const messages = await Message.find({ groupId: group._id })
      .sort({ timestamp: -1 })
      .limit(100);

    res.json({ messages });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

export const addGroupMember = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    const adminId = req.userId;

    if (!adminId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const group = await Group.findById(id);
    if (!group) {
      res.status(404).json({ error: 'Group not found' });
      return;
    }

    if (group.adminId.toString() !== adminId) {
      res.status(403).json({ error: 'Only admin can add members' });
      return;
    }

    group.members.push(new Types.ObjectId(userId));
    await group.save();

    res.json({ group });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};