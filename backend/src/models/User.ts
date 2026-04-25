import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  username: string;
  email: string;
  passwordHash: string;
  publicKey?: string;
  lastSeen: Date;
  bluetoothMac?: string;
  isOnline: boolean;
  deviceToken?: string;
}

const userSchema = new Schema<IUser>(
  {
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    publicKey: { type: String, default: '' },
    lastSeen: { type: Date, default: Date.now },
    bluetoothMac: { type: String, default: '' },
    isOnline: { type: Boolean, default: false },
    deviceToken: { type: String },
  },
  { timestamps: true }
);

export const User = mongoose.model<IUser>('User', userSchema);