import mongoose, { Document, Schema } from 'mongoose';

export interface IAudioCategory extends Document {
  userId: string;
  name?: string;
  imageUrl?: string;
  createdAt: Date;
}

const audioCategorySchema = new Schema<IAudioCategory>({
  userId: {
    required: true,
    type: String
  },
  name: {
    required: false,
    type: String,
    unique: true
  },
  imageUrl: {
    required: false,
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
}, { collection: 'Audio Category' });

const AudioCategory = mongoose.models['Audio Category'] || 
  mongoose.model<IAudioCategory>('Audio Category', audioCategorySchema);

export default AudioCategory;
