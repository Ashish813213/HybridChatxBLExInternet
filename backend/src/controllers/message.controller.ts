import { Request, Response } from 'express';
import { Message } from '../models/Message.js';
import { User } from '../models/User.js';
import { Types } from 'mongoose';

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
    const { receiverId, groupId, channelId, content, mode } = req.body;
    const senderId = req.userId;

    if (!senderId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    if (!receiverId && !groupId && !channelId) {
      res.status(400).json({ error: 'Recipient required' });
      return;
    }

    const message = await Message.create({
      senderId: new Types.ObjectId(senderId),
      receiverId: receiverId ? new Types.ObjectId(receiverId) : undefined,
      groupId: groupId ? new Types.ObjectId(groupId) : undefined,
      channelId: channelId ? new Types.ObjectId(channelId) : undefined,
      content,
      timestamp: new Date(),
      mode: mode || 'internet',
      isEncrypted: true,
    });

    const io = req.app.get('io');
    if (io) {
      if (receiverId) {
        io.to(`user:${receiverId}`).emit('new_message', {
          _id: message._id,
          senderId: senderId,
          receiverId: receiverId,
          content: message.content,
          timestamp: message.timestamp,
        });
      }
      if (groupId) {
        io.to(`group:${groupId}`).emit('new_message', {
          _id: message._id,
          senderId: senderId,
          groupId: groupId,
          content: message.content,
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

    const messages = await Message.find({
      $or: [
        { senderId: new Types.ObjectId(senderId) },
        { receiverId: new Types.ObjectId(senderId) },
      ],
    })
      .populate('senderId', 'username email isOnline')
      .populate('receiverId', 'username email isOnline')
      .sort({ timestamp: -1 })
      .limit(100);

    const userId = String(senderId);
    const conversationMap = new Map();

    messages.forEach((msg) => {
      const senderObj = msg.senderId as unknown as { _id: Types.ObjectId; username: string; email: string; isOnline: boolean };
      const receiverObj = msg.receiverId as unknown as { _id: Types.ObjectId; username: string; email: string; isOnline: boolean } | null;
      
      const senderIdStr = String(msg.senderId);
      const receiverIdStr = msg.receiverId ? String(msg.receiverId) : null;

      if (senderIdStr === userId && receiverIdStr && receiverIdStr !== userId) {
        if (!conversationMap.has(receiverIdStr)) {
          conversationMap.set(receiverIdStr, {
            _id: receiverIdStr,
            username: receiverObj?.username || 'Unknown',
            email: receiverObj?.email || '',
            isOnline: receiverObj?.isOnline || false,
            lastMessage: msg,
          });
        }
      } else if (receiverIdStr === userId && senderIdStr !== userId) {
        if (!conversationMap.has(senderIdStr)) {
          conversationMap.set(senderIdStr, {
            _id: senderIdStr,
            username: senderObj?.username || 'Unknown',
            email: senderObj?.email || '',
            isOnline: senderObj?.isOnline || false,
            lastMessage: msg,
          });
        }
      }
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

    const messages = await Message.find({
      $or: [
        { senderId: new Types.ObjectId(senderId) },
        { receiverId: new Types.ObjectId(senderId) },
      ],
    })
      .populate('senderId', 'username')
      .populate('receiverId', 'username')
      .sort({ timestamp: -1 })
      .limit(100);

    res.json({ messages });
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