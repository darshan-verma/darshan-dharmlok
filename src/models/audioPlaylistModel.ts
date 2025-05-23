import mongoose, { Document, Schema } from 'mongoose';

export interface IAudioPlaylist extends Document {
  userId: string;
  name?: string;
  imageUrl?: string;
  category?: string;
  createdAt: Date;
}

const audioPlaylistSchema = new Schema<IAudioPlaylist>({
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
  category: {
    required: false,
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
}, { collection: 'Audio Playlist' });

const AudioPlaylist = mongoose.models['Audio Playlist'] || 
  mongoose.model<IAudioPlaylist>('Audio Playlist', audioPlaylistSchema);

export default AudioPlaylist;
