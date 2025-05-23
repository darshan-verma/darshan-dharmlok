import mongoose, { Document, Schema } from 'mongoose';

export interface IComment extends Document {
  userId: string;
  postId?: string;
  comment?: string;
  approved?: number;
  createdAt: Date;
}

const commentSchema = new Schema<IComment>({
  userId: {
    required: true,
    type: String,
    unique: false
  },
  postId: {
    required: false,
    type: String,
    unique: false
  },
  comment: {
    required: false,
    type: String,
    unique: false
  },
  approved: {
    required: false,
    type: Number,
    default: 0,
    unique: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
}, { collection: 'comments' });

const Comment = mongoose.models.comments || mongoose.model<IComment>('comments', commentSchema);

export default Comment;
