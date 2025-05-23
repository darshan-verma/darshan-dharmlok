import mongoose, { Document, Schema } from 'mongoose';

export interface IBooking extends Document {
  userId: string;
  name?: string;
  id?: string;
  type?: string;
  email?: string;
  country?: string;
  description?: string;
  date?: string;
  duration?: number;
  person?: number;
  phone?: string;
  createdAt: Date;
}

const bookingSchema = new Schema<IBooking>({
  userId: {
    required: true,
    type: String
  },
  name: {
    required: false,
    type: String
  },
  id: {
    required: false,
    type: String
  },
  type: {
    required: false,
    type: String
  },
  email: {
    required: false,
    type: String,
  },
  country: {
    required: false,
    type: String,
  },
  description: {
    required: false,
    type: String,
    default: ''
  },
  date: {
    required: false,
    type: String,
    default: ''
  },
  duration: {
    required: false,
    type: Number,
    default: 0
  },
  person: {
    required: false,
    type: Number,
    default: 0
  },
  phone: {
    required: false,
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
}, { collection: 'Booking' });

const Booking = mongoose.models.Booking || mongoose.model<IBooking>('Booking', bookingSchema);

export default Booking;
