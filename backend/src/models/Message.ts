import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IMessageReaction {
  userId: Types.ObjectId;
  type: string;
  reactedAt: Date;
}

export interface IMessage extends Document {
  senderId: Types.ObjectId;
  receiverId?: Types.ObjectId;
  groupId?: Types.ObjectId;
  channelId?: Types.ObjectId;
  content: string;
  timestamp: Date;
  mode: 'bluetooth' | 'internet';
  isEncrypted: boolean;
  reactions: IMessageReaction[];
  metadata?: Record<string, unknown>;
}

const messageSchema = new Schema<IMessage>(
  {
    senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    receiverId: { type: Schema.Types.ObjectId, ref: 'User' },
    groupId: { type: Schema.Types.ObjectId, ref: 'Group' },
    channelId: { type: Schema.Types.ObjectId, ref: 'Channel' },
    content: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    mode: { type: String, enum: ['bluetooth', 'internet'], default: 'internet' },
    isEncrypted: { type: Boolean, default: true },
    reactions: [
      {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        type: { type: String, required: true, trim: true },
        reactedAt: { type: Date, default: Date.now },
      },
    ],
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

messageSchema.index({ senderId: 1, receiverId: 1, timestamp: 1 });

export const Message = mongoose.model<IMessage>('Message', messageSchema);