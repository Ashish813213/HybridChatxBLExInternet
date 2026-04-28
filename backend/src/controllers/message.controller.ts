import { Request, Response } from 'express';
import { Message } from '../models/Message.js';
import { User } from '../models/User.js';
import { Channel } from '../models/Channel.js';
import { Types } from 'mongoose';

type PopulatedUser = {
  _id?: Types.ObjectId | string;
  username?: string;
  email?: string;
  isOnline?: boolean;
};

const getIdString = (value: unknown): string | null => {
  if (!value) {
    return null;
  }

  if (typeof value === 'string') {
    return value;
  }

  if (value instanceof Types.ObjectId) {
    return value.toString();
  }

  if (typeof value === 'object') {
    const obj = value as { _id?: Types.ObjectId | string; toString?: () => string };
    if (obj._id) {
      return String(obj._id);
    }

    if (typeof obj.toString === 'function') {
      const asString = obj.toString();
      return asString === '[object Object]' ? null : asString;
    }
  }

  return null;
};

const mapConversationUser = (value: unknown, fallbackId: string) => {
  const user = (value as PopulatedUser | null) || null;

  return {
    _id: fallbackId,
    username: user?.username || 'Unknown',
    email: user?.email || '',
    isOnline: user?.isOnline || false,
  };
};

export const searchUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const senderId = req.userId;
    const { q } = req.query;

    if (!senderId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const query = q ? { username: { $regex: q, $options: 'i' }, _id: { $ne: new Types.ObjectId(senderId) } } : { _id: { $ne: new Types.ObjectId(senderId) } };

    const users = await User.find(query).select('username email isOnline lastSeen').limit(20);

    res.json({ users });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

export const sendMessage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { receiverId, groupId, channelId, content, imageUrl, mode } = req.body;
    const senderId = req.userId;

    if (!senderId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    if (!receiverId && !groupId && !channelId) {
      res.status(400).json({ error: 'Recipient required' });
      return;
    }

    // Must have either content or image
    if (!content && !imageUrl) {
      res.status(400).json({ error: 'Message content or image required' });
      return;
    }

    if (channelId) {
      const channel = await Channel.findById(channelId);
      if (!channel) {
        res.status(404).json({ error: 'Channel not found' });
        return;
      }

      if (!channel.adminId.equals(new Types.ObjectId(senderId))) {
        res.status(403).json({ error: 'Only channel creator can post. Members can only react.' });
        return;
      }
    }

    const message = await Message.create({
      senderId: new Types.ObjectId(senderId),
      receiverId: receiverId ? new Types.ObjectId(receiverId) : undefined,
      groupId: groupId ? new Types.ObjectId(groupId) : undefined,
      channelId: channelId ? new Types.ObjectId(channelId) : undefined,
      content: content || '',
      imageUrl,
      timestamp: new Date(),
      mode: mode || 'internet',
      isEncrypted: true,
      reactions: [],
    });

    const io = req.app.get('io');
    if (io) {
      if (receiverId) {
        io.to(`user:${receiverId}`).emit('new_message', {
          _id: message._id,
          senderId: senderId,
          receiverId: receiverId,
          content: message.content,
          imageUrl: message.imageUrl,
          timestamp: message.timestamp,
        });
      }
      if (groupId) {
        io.to(`group:${groupId}`).emit('new_message', {
          _id: message._id,
          senderId: senderId,
          groupId: groupId,
          content: message.content,
          imageUrl: message.imageUrl,
          timestamp: message.timestamp,
        });
      }
      if (channelId) {
        io.to(`channel:${channelId}`).emit('new_message', {
          _id: message._id,
          senderId: senderId,
          channelId: channelId,
          content: message.content,
          imageUrl: message.imageUrl,
          reactions: message.reactions,
          timestamp: message.timestamp,
        });
      }
    }

    res.status(201).json({ message, success: true });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

export const getConversations = async (req: Request, res: Response): Promise<void> => {
  try {
    const senderId = req.userId;

    if (!senderId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const userObjectId = new Types.ObjectId(senderId);

    const messages = await Message.find({
      receiverId: { $exists: true, $ne: null },
      $or: [
        { senderId: userObjectId },
        { receiverId: userObjectId },
      ],
    })
      .populate('senderId', 'username email isOnline')
      .populate('receiverId', 'username email isOnline')
      .sort({ timestamp: -1 })
      .limit(200);

    const userId = String(senderId);
    const conversationMap = new Map<
      string,
      {
        _id: string;
        username: string;
        email: string;
        isOnline: boolean;
        lastMessage: {
          _id: unknown;
          senderId: string | null;
          receiverId: string | null;
          content: string;
          timestamp: Date;
        };
      }
    >();

    messages.forEach((msg) => {
      const senderIdStr = getIdString(msg.senderId);
      const receiverIdStr = getIdString(msg.receiverId);

      if (!senderIdStr || !receiverIdStr) {
        return;
      }

      let conversationId: string | null = null;
      let conversationUser: ReturnType<typeof mapConversationUser> | null = null;

      if (senderIdStr === userId && receiverIdStr !== userId) {
        conversationId = receiverIdStr;
        conversationUser = mapConversationUser(msg.receiverId, receiverIdStr);
      } else if (receiverIdStr === userId && senderIdStr !== userId) {
        conversationId = senderIdStr;
        conversationUser = mapConversationUser(msg.senderId, senderIdStr);
      }

      if (!conversationId || !conversationUser || conversationMap.has(conversationId)) {
        return;
      }

      conversationMap.set(conversationId, {
        ...conversationUser,
        lastMessage: {
          _id: msg._id,
          senderId: senderIdStr,
          receiverId: receiverIdStr,
          content: msg.content,
          timestamp: msg.timestamp,
        },
      });
    });

    res.json({ conversations: Array.from(conversationMap.values()) });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

export const syncMessages = async (req: Request, res: Response): Promise<void> => {
  try {
    const senderId = req.userId;

    if (!senderId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const userObjectId = new Types.ObjectId(senderId);

    const messages = await Message.find({
      receiverId: { $exists: true, $ne: null },
      $or: [
        { senderId: userObjectId },
        { receiverId: userObjectId },
      ],
    })
      .sort({ timestamp: 1 })
      .limit(500)
      .lean();

    const normalizedMessages = messages.map((msg) => ({
      ...msg,
      senderId: getIdString(msg.senderId),
      receiverId: getIdString(msg.receiverId),
      groupId: getIdString(msg.groupId),
      channelId: getIdString(msg.channelId),
    }));

    res.json({ messages: normalizedMessages });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

export const logBluetoothMessage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { receiverId, messageId, timestamp, metadata } = req.body;
    const senderId = req.userId;

    if (!senderId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const message = await Message.create({
      senderId: new Types.ObjectId(senderId),
      receiverId: receiverId ? new Types.ObjectId(receiverId) : undefined,
      content: '',
      timestamp: timestamp ? new Date(timestamp) : new Date(),
      mode: 'bluetooth',
      isEncrypted: false,
      metadata: {
        bluetoothMessageId: messageId,
        ...metadata,
      },
    });

    res.json({ success: true, message });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

export const getNearbyUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const senderId = req.userId;

    if (!senderId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const nearbyUsers = await User.find({
      _id: { $ne: new Types.ObjectId(senderId) },
      isOnline: true,
    }).select('username bluetoothMac isOnline lastSeen');

    res.json({ users: nearbyUsers });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};