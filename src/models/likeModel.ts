import mongoose, { Document, Schema } from 'mongoose';

export interface ILike extends Document {
  userId: string;
  postId: string;
  createdAt: Date;
}

const likeSchema = new Schema<ILike>({
  userId: {
    required: true,
    type: String
  },
  postId: {
    required: true,
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
}, { collection: 'like' });

// Create a compound index for userId and postId with unique constraint
likeSchema.index({
  userId: 1,
  postId: 1,
}, {
  unique: true,
});

const Like = mongoose.models.like || mongoose.model<ILike>('like', likeSchema);

export default Like;
