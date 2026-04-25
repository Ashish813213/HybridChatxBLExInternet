import { Request, Response } from 'express';
import { Channel } from '../models/Channel.js';
import { Message } from '../models/Message.js';
import { Types } from 'mongoose';

export const getAllChannels = async (req: Request, res: Response): Promise<void> => {
  try {
    const channels = await Channel.find().sort({ createdAt: -1 }).limit(50);
    res.json({ channels });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

export const createChannel = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, isPublic } = req.body;
    const adminId = req.userId;

    if (!adminId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const channel = await Channel.create({
      name,
      adminId: new Types.ObjectId(adminId),
      subscribers: [],
      createdAt: new Date(),
      isPublic: isPublic ?? true,
    });

    res.status(201).json({ channel });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

export const subscribeChannel = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const channel = await Channel.findById(id);
    if (!channel) {
      res.status(404).json({ error: 'Channel not found' });
      return;
    }

    const userIdObj = new Types.ObjectId(userId);
    if (!channel.subscribers.some((sub) => sub.equals(userIdObj))) {
      channel.subscribers.push(userIdObj);
      await channel.save();
    }

    res.json({ channel });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

export const getChannelMessages = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const channel = await Channel.findById(id);
    if (!channel) {
      res.status(404).json({ error: 'Channel not found' });
      return;
    }

    const messages = await Message.find({ channelId: channel._id })
      .sort({ timestamp: -1 })
      .limit(100);

    res.json({ messages });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};