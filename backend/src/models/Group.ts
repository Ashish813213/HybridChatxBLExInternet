import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IGroup extends Document {
  name: string;
  adminId: Types.ObjectId;
  members: Types.ObjectId[];
  createdAt: Date;
  groupPublicKey?: string;
}

const groupSchema = new Schema<IGroup>(
  {
    name: { type: String, required: true },
    adminId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    members: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    createdAt: { type: Date, default: Date.now },
    groupPublicKey: { type: String },
  },
  { timestamps: true }
);

groupSchema.index({ name: 1 });
groupSchema.index({ adminId: 1 });

export const Group = mongoose.model<IGroup>('Group', groupSchema);