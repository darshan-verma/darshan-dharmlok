import mongoose, { Document, Schema } from 'mongoose';

export interface IDharamshala extends Document {
  userId: string;
  bannerImageUrl?: string;
  city?: string;
  description?: string;
  location?: string;
  name?: string;
  relatedImageUrl?: string;
  state?: string;
  lattitude?: string;
  longitude?: string;
  language?: string;
  active?: number;
  createdAt: Date;
}

const dharamshalaSchema = new Schema<IDharamshala>({
  userId: {
    required: true,
    type: String
  },
  bannerImageUrl: {
    required: false,
    type: String,
    default: ''
  },
  city: {
    required: false,
    type: String,
    default: ''
  },
  description: {
    required: false,
    type: String,
    default: ''
  },
  location: {
    required: false,
    type: String,
    default: ''
  },
  name: {
    required: false,
    type: String,
    default: ''
  },
  relatedImageUrl: {
    required: false,
    type: String,
    default: ''
  },
  state: {
    required: false,
    type: String,
    default: ''
  },
  lattitude: {
    required: false,
    type: String,
    default: ''
  },
  longitude: {
    required: false,
    type: String,
    default: ''
  },
  language: {
    required: false,
    type: String,
    default: ''
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
}, { collection: 'Dharamshala' });

const Dharamshala = mongoose.models.Dharamshala || mongoose.model<IDharamshala>('Dharamshala', dharamshalaSchema);

export default Dharamshala;
