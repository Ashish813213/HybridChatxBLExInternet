import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IChannel extends Document {
  name: string;
  adminId: Types.ObjectId;
  subscribers: Types.ObjectId[];
  createdAt: Date;
  isPublic: boolean;
}

const channelSchema = new Schema<IChannel>(
  {
    name: { type: String, required: true },
    adminId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    subscribers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    createdAt: { type: Date, default: Date.now },
    isPublic: { type: Boolean, default: true },
  },
  { timestamps: true }
);

channelSchema.index({ name: 1 });

export const Channel = mongoose.model<IChannel>('Channel', channelSchema);