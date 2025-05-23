import mongoose, { Document, Schema } from 'mongoose';

export interface IOrder extends Document {
  userId: string;
  orderId?: string;
  title?: string;
  id?: string; // product service or event id
  providerId?: string;
  amount: number;
  quantity?: number;
  type?: string;
  paymentStatus: number;
  paymentId?: string;
  customerId?: string;
  approved?: number;
  createdAt: Date;
}

const orderSchema = new Schema<IOrder>({
  userId: {
    required: true,
    type: String,
  },
  orderId: {
    required: false,
    type: String,
  },
  title: {
    required: false,
    type: String,
  },
  id: { // product service or event id
    required: false,
    type: String,
  },
  providerId: {
    required: false,
    type: String,
  },
  amount: {
    required: true,
    type: Number,
  },
  quantity: {
    required: false,
    type: Number,
    default: 1
  },
  type: {
    required: false,
    type: String,
    default: ''
  },
  paymentStatus: {
    required: true,
    type: Number,
    default: 0
  },
  paymentId: {
    required: false,
    type: String,
    default: ''
  },
  customerId: {
    required: false,
    type: String,
  },
  approved: {
    required: false,
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
}, { collection: 'PaymentOrder' });

const Order = mongoose.models.PaymentOrder || mongoose.model<IOrder>('PaymentOrder', orderSchema);

export default Order;
