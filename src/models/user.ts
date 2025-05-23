import mongoose, { Document, Schema } from 'mongoose';

// Define the interface for the user document
export interface IUser extends Document {
  name: string;
  phone: string;
  email: string;
  userType?: string;
  typeVendor?: string;
  profileImageUrl?: string;
  description?: string;
  coverImageUrl?: string;
  category?: string;
  password: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  social?: number;
  active?: number;
  rank?: number;
  pincode?: string;
  availability?: number;
  kycApproved?: number;
  createdAt: Date;
}

const userSchema = new Schema<IUser>({
  name: {
    required: true,
    type: String
  },
  phone: {
    required: true,
    type: String,
    unique: true
  },
  email: {
    required: true,
    type: String,
    unique: true
  },
  userType: {
    required: false,
    type: String,
  },
  typeVendor: {
    required: false,
    type: String,
    default: ''
  },
  profileImageUrl: {
    required: false,
    type: String,
    default: '1662632016476.webp'
  },
  description: {
    required: false,
    type: String,
    default: ''
  },
  coverImageUrl: {
    required: false,
    type: String,
    default: '1662565875921.webp'
  },
  category: {
    required: false,
    type: String,
    default: ''
  },
  password: {
    required: true,
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
  state: {
    required: false,
    type: String,
    default: ''
  },
  country: {
    required: false,
    type: String,
    default: ''
  },
  social: {
    required: false,
    type: Number,
    default: 0
  },
  active: {
    required: false,
    type: Number,
    default: 1
  },
  rank: {
    required: false,
    type: Number,
    default: -1
  },
  pincode: {
    required: false,
    type: String,
    default: ''
  },
  availability: {
    required: false,
    type: Number,
    default: 0
  },
  kycApproved: {
    required: false,
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
});

const User = mongoose.models.users || mongoose.model<IUser>('users', userSchema);

export default User;
