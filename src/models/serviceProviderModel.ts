import mongoose, { Document, Schema } from 'mongoose';

export interface IServiceProvider extends Document {
  userId: string;
  name?: string;
  address?: string;
  buisnessName?: string;
  profileImageUrl?: string;
  gstNo?: string;
  panNo?: string;
  aadhaarNo?: string;
  bankName?: string;
  IFSC?: string;
  panUrl?: string;
  gstUrl?: string;
  comment?: string;
  accountNo?: number;
  aadhaarImageUrl?: string;
  createdAt: Date;
}

const serviceProviderSchema = new Schema<IServiceProvider>({
  userId: {
    required: true,
    type: String
  },
  name: {
    required: false,
    type: String,
    default: ''
  },
  address: {
    required: false,
    type: String,
    default: ''
  },
  buisnessName: {
    required: false,
    type: String,
    default: ''
  },
  profileImageUrl: {
    required: false,
    type: String,
    default: '1653326870689.png'
  },
  gstNo: {
    required: false,
    type: String,
    default: ''
  },
  panNo: {
    required: false,
    type: String,
    default: ''
  },
  aadhaarNo: {
    required: false,
    type: String,
    default: ''
  },
  bankName: {
    required: false,
    type: String,
    default: ''
  },
  IFSC: {
    required: false,
    type: String,
    default: ''
  },
  panUrl: {
    required: false,
    type: String,
    default: ''
  },
  gstUrl: {
    required: false,
    type: String,
    default: ''
  },
  comment: {
    required: false,
    type: String,
    default: ''
  },
  accountNo: {
    required: false,
    type: Number,
    default: 0
  },
  aadhaarImageUrl: {
    required: false,
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
}, { collection: 'Service Provider Details' });

const ServiceProvider = mongoose.models['Service Provider Details'] || 
  mongoose.model<IServiceProvider>('Service Provider Details', serviceProviderSchema);

export default ServiceProvider;
