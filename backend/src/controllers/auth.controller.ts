import { Request, Response } from 'express';
import { User } from '../models/User.js';
import { Token } from '../models/Token.js';
import { hashPassword, comparePassword, generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/index.js';
import { Types } from 'mongoose';

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, email, password, publicKey, bluetoothMac } = req.body;

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      res.status(400).json({ error: 'User already exists' });
      return;
    }

    const passwordHash = await hashPassword(password);
    const user = await User.create({
      username,
      email,
      passwordHash,
      publicKey: publicKey || '',
      bluetoothMac: bluetoothMac || '',
      lastSeen: new Date(),
      isOnline: true,
    });

    const accessToken = generateAccessToken(user._id.toString());
    const refreshToken = generateRefreshToken(user._id.toString());

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    await Token.create({
      userId: user._id,
      token: refreshToken,
      expiresAt,
      createdAt: new Date(),
    });

    res.status(201).json({
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        publicKey: user.publicKey,
        bluetoothMac: user.bluetoothMac,
      },
      token: accessToken,
      refreshToken,
    });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const isValid = await comparePassword(password, user.passwordHash);
    if (!isValid) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    await User.updateOne({ _id: user._id }, { isOnline: true, lastSeen: new Date() });

    const accessToken = generateAccessToken(user._id.toString());
    const refreshToken = generateRefreshToken(user._id.toString());

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    await Token.create({
      userId: user._id,
      token: refreshToken,
      expiresAt,
      createdAt: new Date(),
    });

    res.json({
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        publicKey: user.publicKey,
        bluetoothMac: user.bluetoothMac,
      },
      token: accessToken,
      refreshToken,
    });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

export const refreshToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.body;

    if (!token) {
      res.status(400).json({ error: 'Token required' });
      return;
    }

    const decoded = verifyRefreshToken(token);
    if (!decoded) {
      res.status(401).json({ error: 'Invalid refresh token' });
      return;
    }

    const storedToken = await Token.findOne({ token, expiresAt: { $gt: new Date() } });
    if (!storedToken) {
      res.status(401).json({ error: 'Refresh token expired or revoked' });
      return;
    }

    await Token.deleteOne({ _id: storedToken._id });

    const newAccessToken = generateAccessToken(decoded.userId);
    const newRefreshToken = generateRefreshToken(decoded.userId);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    await Token.create({
      userId: new Types.ObjectId(decoded.userId),
      token: newRefreshToken,
      expiresAt,
      createdAt: new Date(),
    });

    res.json({ token: newAccessToken, refreshToken: newRefreshToken });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.body;
    if (userId) {
      await User.updateOne({ _id: userId }, { isOnline: false });
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};