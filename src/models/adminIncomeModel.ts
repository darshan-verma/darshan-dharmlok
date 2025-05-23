import mongoose, { Document, Schema } from 'mongoose';

export interface IAdminIncome extends Document {
  providerId?: string;
  orderId?: string;
  id?: string;
  balance?: number;
  createdAt: Date;
}

const adminIncomeSchema = new Schema<IAdminIncome>({
  providerId: {
    required: false,
    type: String
  },
  orderId: {
    required: false,
    type: String
  },
  id: {
    required: false,
    type: String
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
}, { collection: 'AdminIncome' });

const AdminIncome = mongoose.models.AdminIncome || mongoose.model<IAdminIncome>('AdminIncome', adminIncomeSchema);

export default AdminIncome;
