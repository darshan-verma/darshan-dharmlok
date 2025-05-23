import mongoose, { Document, Schema } from 'mongoose';

export interface IEbook extends Document {
  userId?: string;
  name?: string;
  description?: string;
  category?: string;
  type?: string;
  language?: string;
  PDFuploadUrl?: string;
  thumbNailImageUrl?: string;
  active?: number;
  createdAt: Date;
}

const ebookSchema = new Schema<IEbook>({
  userId: {
    required: false,
    type: String
  },
  name: {
    required: false,
    type: String,
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
  language: {
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
  active: {
    required: false,
    type: Number,
    default: 1
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
}, { collection: 'EBook' });

const Ebook = mongoose.models.EBook || mongoose.model<IEbook>('EBook', ebookSchema);

export default Ebook;
