import mongoose, { Document, Schema } from 'mongoose';

export interface IAudio extends Document {
  userId: string;
  title?: string;
  description?: string;
  category?: string;
  playlist?: string;
  bannerImageUrl?: string;
  audioUrl?: string;
  createdAt: Date;
}

const audioSchema = new Schema<IAudio>({
  userId: {
    required: true,
    type: String
  },
  title: {
    required: false,
    type: String
  },
  description: {
    required: false,
    type: String
  },
  category: {
    required: false,
    type: String,
  },
  playlist: {
    required: false,
    type: String,
    default: ''
  },
  bannerImageUrl: {
    required: false,
    type: String,
  },
  audioUrl: {
    required: false,
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
}, { collection: 'Audio' });

const Audio = mongoose.models.Audio || mongoose.model<IAudio>('Audio', audioSchema);

export default Audio;
