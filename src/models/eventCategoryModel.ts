import mongoose, { Document, Schema } from 'mongoose';

export interface IEventCategory extends Document {
  userId: string;
  name?: string;
  createdAt: Date;
}

const eventSchema = new Schema<IEventCategory>({
  userId: {
    required: true,
    type: String
  },
  name: {
    required: false,
    type: String,
    unique: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
}, { collection: 'Event Category' });

const EventCategory = mongoose.models['Event Category'] || 
  mongoose.model<IEventCategory>('Event Category', eventSchema);

export default EventCategory;
