import mongoose, { Document, Schema } from 'mongoose';

export interface ICouponLog extends Document {
  userId: string;
  couponId?: string;
  timeUsed?: number;
  createdAt: Date;
}

const couponLogSchema = new Schema<ICouponLog>({
  userId: {
    required: true,
    type: String
  },
  couponId: {
    required: false,
    type: String,
  },
  timeUsed: {
    required: false,
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
}, { collection: 'CouponLog' });

const CouponLog = mongoose.models.CouponLog || mongoose.model<ICouponLog>('CouponLog', couponLogSchema);

export default CouponLog;
