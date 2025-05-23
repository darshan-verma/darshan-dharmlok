import mongoose, { Document, Schema } from 'mongoose';

export interface IDharshan extends Document {
  userId: string;
  title: string;
  description: string;
  url?: string;
  category?: string;
  type?: string;
  rank?: number;
  createdAt: Date;
}

const dharshanSchema = new Schema<IDharshan>({
  userId: {
    required: true,
    type: String
  },
  title: {
    required: true,
    type: String
  },
  description: {
    required: true,
    type: String
  },
  url: {
    required: false,
    type: String,
  },
  category: {
    required: false,
    type: String,
  },
  type: {
    required: false,
    type: String,
  },
  rank: {
    required: false,
    type: Number,
    default: -1
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
}, { collection: 'Dharshan' });

const Dharshan = mongoose.models.Dharshan || mongoose.model<IDharshan>('Dharshan', dharshanSchema);

export default Dharshan;
