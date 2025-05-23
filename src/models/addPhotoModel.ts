import mongoose, { Document, Schema } from 'mongoose';

export interface IPhoto extends Document {
  userId: string;
  description?: string;
  title?: string;
  imageUrl?: string;
  createdAt: Date;
}

const addPhotoSchema = new Schema<IPhoto>({
  userId: {
    required: true,
    type: String
  },
  description: {
    required: false,
    type: String
  },
  title: {
    required: false,
    type: String
  },
  imageUrl: {
    required: false,
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
}, { collection: 'Photos' });

const Photo = mongoose.models.Photos || mongoose.model<IPhoto>('Photos', addPhotoSchema);

export default Photo;
