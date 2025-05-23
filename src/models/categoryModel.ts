import mongoose, { Document, Schema } from 'mongoose';

export interface ICategory extends Document {
  userId: string;
  name?: string;
  createdAt: Date;
}

const categorySchema = new Schema<ICategory>({
  userId: {
    required: true,
    type: String
  },
  name: {
    required: false,
    type: String,
    unique: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
}, { collection: 'Product' }); // Note: Collection name is 'Product' despite model name being 'Categories'

const Category = mongoose.models.Categories || mongoose.model<ICategory>('Categories', categorySchema);

export default Category;
