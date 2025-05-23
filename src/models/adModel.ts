import mongoose, { Document, Schema } from 'mongoose';

export interface IAd extends Document {
  userId: string;
  name?: string;
  phone?: string;
  description?: string;
  approved?: number;
  createdAt: Date;
}

const adSchema = new Schema<IAd>({
  userId: {
    required: true,
    type: String
  },
  name: {
    required: false,
    type: String
  },
  phone: {
    required: false,
    type: String
  },
  description: {
    required: false,
    type: String,
  },
  approved: {
    required: false,
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
}, { collection: 'Ad' });

const Ad = mongoose.models.Ad || mongoose.model<IAd>('Ad', adSchema);

export default Ad;
