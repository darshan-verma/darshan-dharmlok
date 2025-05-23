import mongoose, { Document, Schema } from 'mongoose';

export interface IVideo extends Document {
  userId: string;
  title: string;
  description: string;
  videoUrl?: string;
  createdAt: Date;
}

const addVideoSchema = new Schema<IVideo>({
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
  videoUrl: {
    required: false,
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
}, { collection: 'Videos' });

const Video = mongoose.models.Videos || mongoose.model<IVideo>('Videos', addVideoSchema);

export default Video;
