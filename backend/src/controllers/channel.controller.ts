import { Request, Response } from 'express';
import { Channel } from '../models/Channel.js';
import { Message } from '../models/Message.js';
import { Types } from 'mongoose';

const ALLOWED_REACTIONS = ['like', 'love', 'clap'];

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

export const reactToChannelMessage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, messageId } = req.params;
    const userId = req.userId;
    const reactionType = String(req.body?.type || '').trim().toLowerCase();

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    if (!ALLOWED_REACTIONS.includes(reactionType)) {
      res.status(400).json({ error: 'Invalid reaction type' });
      return;
    }

    const channel = await Channel.findById(id);
    if (!channel) {
      res.status(404).json({ error: 'Channel not found' });
      return;
    }

    const userIdObj = new Types.ObjectId(userId);
    const isAdmin = channel.adminId.equals(userIdObj);
    const isSubscriber = channel.subscribers.some((sub) => sub.equals(userIdObj));

    if (!isAdmin && !isSubscriber) {
      res.status(403).json({ error: 'Subscribe to channel before reacting' });
      return;
    }

    const message = await Message.findOne({ _id: messageId, channelId: channel._id });
    if (!message) {
      res.status(404).json({ error: 'Channel message not found' });
      return;
    }

    const existingReactionIndex = message.reactions.findIndex((reaction) =>
      reaction.userId.equals(userIdObj)
    );

    if (existingReactionIndex >= 0) {
      const currentReaction = message.reactions[existingReactionIndex];
      if (currentReaction.type === reactionType) {
        message.reactions.splice(existingReactionIndex, 1);
      } else {
        currentReaction.type = reactionType;
        currentReaction.reactedAt = new Date();
      }
    } else {
      message.reactions.push({
        userId: userIdObj,
        type: reactionType,
        reactedAt: new Date(),
      });
    }

    await message.save();

    const io = req.app.get('io');
    if (io) {
      io.to(`channel:${id}`).emit('channel_reaction_updated', {
        messageId,
        reactions: message.reactions,
      });
    }

    res.json({ message });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};