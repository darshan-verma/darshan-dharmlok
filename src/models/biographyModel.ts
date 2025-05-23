import mongoose, { Document, Schema } from 'mongoose';

export interface IBiography extends Document {
  userId: string;
  name?: string;
  description?: string;
  profileImageUrl?: string;
  coverImageUrl?: string;
  category?: string;
  createdAt: Date;
}

const biographySchema = new Schema<IBiography>({
  userId: {
    required: true,
    type: String
  },
  name: {
    required: false,
    type: String
  },
  description: {
    required: false,
    type: String
  },
  profileImageUrl: {
    required: false,
    type: String,
  },
  coverImageUrl: {
    required: false,
    type: String,
  },
  category: {
    required: false,
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
}, { collection: 'biography' });

const Biography = mongoose.models.biography || mongoose.model<IBiography>('biography', biographySchema);

export default Biography;
