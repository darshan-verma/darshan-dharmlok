import mongoose, { Document, Schema } from 'mongoose';

export interface ICoupon extends Document {
  codeName: string;
  discount?: number;
  status?: number;
  validTill?: string;
  userLimit?: number;
  timesUsed?: number;
  createdAt: Date;
}

const couponSchema = new Schema<ICoupon>({
  codeName: {
    required: true,
    type: String
  },
  discount: {
    required: false,
    type: Number,
  },
  status: {
    required: false,
    type: Number,
    default: 1
  },
  validTill: {
    required: false,
    type: String,
  },
  userLimit: {
    required: false,
    type: Number,
  },
  timesUsed: {
    type: Number,
    required: false,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
}, { collection: 'Coupon' });

const Coupon = mongoose.models.Coupon || mongoose.model<ICoupon>('Coupon', couponSchema);

export default Coupon;
