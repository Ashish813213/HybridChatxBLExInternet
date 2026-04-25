import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IBluetoothSession extends Document {
  userId1: Types.ObjectId;
  userId2: Types.ObjectId;
  lastConnected: Date;
  sessionKey: string;
  metadata?: Record<string, unknown>;
}

const bluetoothSessionSchema = new Schema<IBluetoothSession>(
  {
    userId1: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    userId2: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    lastConnected: { type: Date, default: Date.now },
    sessionKey: { type: String, required: true },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

bluetoothSessionSchema.index({ userId1: 1, userId2: 1 });

export const BluetoothSession = mongoose.model<IBluetoothSession>('BluetoothSession', bluetoothSessionSchema);