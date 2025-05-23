import mongoose, { Document, Schema } from 'mongoose';

export interface IWithdrawal extends Document {
  userId: string;
  name?: string;
  balance?: number;
  withDrawal?: number;
  createdAt: Date;
}

const balanceWithdrawal = new Schema<IWithdrawal>({
  userId: {
    required: true,
    type: String,
  },
  name: {
    required: false,
    type: String,
  },
  balance: {
    required: false,
    type: Number,
  },
  withDrawal: {
    required: false,
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
}, { collection: 'Withdrawal' });

const Withdrawal = mongoose.models.Withdrawal || mongoose.model<IWithdrawal>('Withdrawal', balanceWithdrawal);

export default Withdrawal;
