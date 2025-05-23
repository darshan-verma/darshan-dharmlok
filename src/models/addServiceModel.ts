import mongoose, { Document, Schema } from 'mongoose';

export interface IService extends Document {
  userId: string;
  name?: string;
  services?: string;
  type?: string;
  description?: string;
  price?: string;
  city?: string;
  state?: string;
  imageUrl?: string;
  active?: number;
  createdAt: Date;
}

const serviceSchema = new Schema<IService>({
  userId: {
    required: true,
    type: String
  },
  name: {
    required: false,
    type: String
  },
  services: {
    required: false,
    type: String
  },
  type: {
    required: false,
    type: String,
  },
  description: {
    required: false,
    type: String,
  },
  price: {
    required: false,
    type: String,
  },
  city: {
    required: false,
    type: String,
  },
  state: {
    required: false,
    type: String,
  },
  imageUrl: {
    required: false,
    type: String,
  },
  active: {
    required: false,
    type: Number,
    default: 1
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
}, { collection: 'services' });

const Service = mongoose.models.services || mongoose.model<IService>('services', serviceSchema);

export default Service;
