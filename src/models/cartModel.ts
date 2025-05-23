import mongoose, { Document, Schema } from 'mongoose';

export interface ICart extends Document {
  userId: string;
  productId?: string;
  providerId: string;
  title: string;
  description: string;
  price: number;
  imageUrl?: string;
  type?: string;
  typeString?: string;
  pricePerUnit?: number;
  quantity: number;
  category?: string;
  createdAt: Date;
}

const cartSchema = new Schema<ICart>({
  userId: {
    required: true,
    type: String,
  },
  productId: {
    required: false,
    type: String,
  },
  providerId: {
    required: true,
    type: String
  },
  title: {
    required: true,
    type: String
  },
  description: {
    required: true,
    type: String,
  },
  price: {
    required: true,
    type: Number,
  },
  imageUrl: {
    required: false,
    type: String,
  },
  type: {
    required: false,
    type: String,
  },
  typeString: {
    required: false,
    type: String,
    default: ''
  },
  pricePerUnit: {
    required: false,
    type: Number,
  },
  quantity: {
    required: true,
    type: Number,
    default: 1
  },
  category: {
    required: false,
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
}, { collection: 'cart' });

const Cart = mongoose.models.cart || mongoose.model<ICart>('cart', cartSchema);

export default Cart;
