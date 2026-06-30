import { Server as SocketServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';
import { Group } from '../models/Group.js';
import { Channel } from '../models/Channel.js';
import { Types } from 'mongoose';

const isValidObjectId = (id: string): boolean => Types.ObjectId.isValid(id);

export const initializeSocket = (httpServer: HTTPServer): SocketServer => {
  const io = new SocketServer(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
      socket.data.userId = decoded.userId;
      next();
    } catch {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.data.userId as string;
    console.log(`User connected: ${userId}`);

    socket.join(`user:${userId}`);

    socket.on('join_group', async (groupId: string) => {
      if (!isValidObjectId(groupId)) {
        socket.emit('error', { message: 'Invalid group ID' });
        return;
      }
      try {
        const group = await Group.findById(groupId);
        if (!group) {
          socket.emit('error', { message: 'Group not found' });
          return;
        }
        const isMember =
          group.adminId.toString() === userId ||
          group.members.some((m) => m.toString() === userId);
        if (!isMember) {
          socket.emit('error', { message: 'Not a group member' });
          return;
        }
        socket.join(`group:${groupId}`);
      } catch (err) {
        socket.emit('error', { message: 'Failed to join group' });
      }
    });

    socket.on('leave_group', (groupId: string) => {
      socket.leave(`group:${groupId}`);
    });

    socket.on('join_channel', async (channelId: string) => {
      if (!isValidObjectId(channelId)) {
        socket.emit('error', { message: 'Invalid channel ID' });
        return;
      }
      try {
        const channel = await Channel.findById(channelId);
        if (!channel) {
          socket.emit('error', { message: 'Channel not found' });
          return;
        }
        if (!channel.isPublic) {
          const isSubscriber = channel.subscribers.some((s) => s.toString() === userId);
          if (!isSubscriber && channel.adminId.toString() !== userId) {
            socket.emit('error', { message: 'Not subscribed to private channel' });
            return;
          }
        }
        socket.join(`channel:${channelId}`);
      } catch (err) {
        socket.emit('error', { message: 'Failed to join channel' });
      }
    });

    socket.on('leave_channel', (channelId: string) => {
      socket.leave(`channel:${channelId}`);
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${userId}`);
    });
  });

  return io;
};
