import mongoose, { Document, Schema } from 'mongoose';

export interface ICustomer extends Document {
  userId: string;
  name?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  country?: string;
  pincode?: string;
  orderId?: string;
  createdAt: Date;
}

const customerSchema = new Schema<ICustomer>({
  userId: {
    required: true,
    type: String
  },
  name: {
    required: false,
    type: String
  },
  phone: {
    required: false,
    type: String,
    unique: true
  },
  email: {
    required: false,
    type: String,
  },
  address: {
    required: false,
    type: String,
    default: ''
  },
  city: {
    required: false,
    type: String,
    default: ''
  },
  country: {
    required: false,
    type: String,
    default: ''
  },
  pincode: {
    required: false,
    type: String,
    default: ''
  },
  orderId: {
    required: false,
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
}, { collection: 'comments' }); // Note: Collection name is 'comments' despite model name being 'Customers'

const Customer = mongoose.models.Customers || mongoose.model<ICustomer>('Customers', customerSchema);

export default Customer;
