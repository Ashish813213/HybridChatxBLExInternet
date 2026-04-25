import jwt, { SignOptions } from 'jsonwebtoken';
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 12;

export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, SALT_ROUNDS);
};

export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

export const generateAccessToken = (userId: string): string => {
  const options: SignOptions = { expiresIn: '24h' };
  return jwt.sign({ userId }, process.env.JWT_SECRET!, options);
};

export const generateRefreshToken = (userId: string): string => {
  const options: SignOptions = { expiresIn: '30d' };
  return jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET!, options);
};

export const verifyAccessToken = (token: string): { userId: string } | null => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
  } catch {
    return null;
  }
};

export const verifyRefreshToken = (token: string): { userId: string } | null => {
  try {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as { userId: string };
  } catch {
    return null;
  }
};