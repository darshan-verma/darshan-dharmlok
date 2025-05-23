import mongoose, { Document, Schema } from 'mongoose';

export interface IVendorIncome extends Document {
  providerId: string;
  id?: string;
  balance?: number;
  createdAt: Date;
}

const vendorIncomeSchema = new Schema<IVendorIncome>({
  providerId: {
    required: true,
    type: String
  },
  id: {
    required: false,
    type: String,
  },
  balance: {
    required: false,
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
}, { collection: 'Vendor Income' });

const VendorIncome = mongoose.models['Vendor Income'] || 
  mongoose.model<IVendorIncome>('Vendor Income', vendorIncomeSchema);

export default VendorIncome;
