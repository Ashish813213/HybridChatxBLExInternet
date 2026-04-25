import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IToken extends Document {
  userId: Types.ObjectId;
  token: string;
  expiresAt: Date;
  createdAt: Date;
}

const tokenSchema = new Schema<IToken>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    token: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

tokenSchema.index({ userId: 1 });
tokenSchema.index({ token: 1 }, { unique: true });

export const Token = mongoose.model<IToken>('Token', tokenSchema);