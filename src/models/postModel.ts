import mongoose, { Document, Schema } from 'mongoose';

export interface IPost extends Document {
  userId: string;
  userName?: string;
  userImage?: string;
  description?: string;
  imageUrl?: string;
  videoUrl?: string;
  postType?: string;
  like?: number;
  comment?: number;
  userType?: number;
  isLiked?: boolean;
  createdAt: Date;
}

const postSchema = new Schema<IPost>({
  userId: {
    required: true,
    type: String
  },
  userName: {
    required: false,
    type: String
  },
  userImage: {
    required: false,
    type: String
  },
  description: {
    required: false,
    type: String
  },
  imageUrl: {
    required: false,
    type: String,
    default: ''
  },
  videoUrl: {
    required: false,
    type: String,
    default: ''
  },
  postType: {
    required: false,
    type: String,
  },
  like: {
    required: false,
    type: Number,
    default: 0
  },
  comment: {
    required: false,
    type: Number,
    default: 0
  },
  userType: {
    required: false,
    type: Number,
    default: 0 //0 for kathavachak and 1 for dharamguru
  },
  isLiked: {
    required: false,
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
}, { collection: 'posts' });

const Post = mongoose.models.posts || mongoose.model<IPost>('posts', postSchema);

export default Post;
