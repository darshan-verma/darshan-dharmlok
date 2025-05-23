import mongoose, { Document, Schema } from 'mongoose';

export interface IBalVidya extends Document {
  userId: string;
  name?: string;
  description?: string;
  category?: string;
  type?: string;
  linkType?: string;
  videoUrl?: string;
  PDFuploadUrl?: string;
  thumbNailImageUrl?: string;
  language?: string;
  active?: number;
  createdAt: Date;
}

const balVidyaSchema = new Schema<IBalVidya>({
  userId: {
    required: true,
    type: String
  },
  name: {
    required: false,
    type: String,
    unique: false
  },
  description: {
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
    default: ''
  },
  linkType: {
    required: false,
    type: String,
    default: ''
  },
  videoUrl: {
    required: false,
    type: String,
    default: ''
  },
  PDFuploadUrl: {
    required: false,
    type: String,
    default: ''
  },
  thumbNailImageUrl: {
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
}, { collection: 'BalVidya' });

const BalVidya = mongoose.models.BalVidya || mongoose.model<IBalVidya>('BalVidya', balVidyaSchema);

export default BalVidya;
