import mongoose, { Document, Schema } from 'mongoose';

export interface IHome extends Document {
  userId: string;
  imageUrl?: string;
  title?: string;
  description?: string;
  link?: string;
  phone?: string;
  type?: string;
  thoughtTitle?: string;
  thoughtBody?: string;
  date?: string;
  createdAt: Date;
}

const homeSchema = new Schema<IHome>({
  userId: {
    required: true,
    type: String
  },
  imageUrl: {
    required: false,
    type: String,
    default: ''
  },
  title: {
    required: false,
    type: String,
    default: ''
  },
  description: {
    required: false,
    type: String,
    default: ''
  },
  link: {
    required: false,
    type: String,
    default: ''
  },
  phone: {
    required: false,
    type: String,
    default: ''
  },
  type: {
    required: false,
    type: String,
    default: ''
  },
  thoughtTitle: {
    required: false,
    type: String,
    default: ''
  },
  thoughtBody: {
    required: false,
    type: String,
    default: ''
  },
  date: {
    required: false,
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
}, { collection: 'HomePage' });

const Home = mongoose.models.HomePage || mongoose.model<IHome>('HomePage', homeSchema);

export default Home;
