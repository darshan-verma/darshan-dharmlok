import mongoose, { Document, Schema } from 'mongoose';

export interface ICredit extends Document {
  userId: string;
  amount?: number;
  transactionId?: string;
  date?: string;
  createdAt: Date;
}

const creditSchema = new Schema<ICredit>({
  userId: {
    required: true,
    type: String,
  },
  amount: {
    required: false,
    type: Number,
    default: 0
  },
  transactionId: {
    required: false,
    type: String,
    default: '',
  },
  date: {
    required: false,
    type: String,
    default: '',
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
}, { collection: 'Credit' });

const Credit = mongoose.models.Credit || mongoose.model<ICredit>('Credit', creditSchema);

export default Credit;
