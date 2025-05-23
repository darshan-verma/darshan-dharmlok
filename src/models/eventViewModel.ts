import mongoose, { Document, Schema } from 'mongoose';

export interface IEventView extends Document {
  userId: string;
  eventId?: string;
  createdAt: Date;
}

const eventViewSchema = new Schema<IEventView>({
  userId: {
    required: true,
    type: String
  },
  eventId: {
    required: false,
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
}, { collection: 'Event_Views' });

// Create a compound index for userId and eventId with unique constraint
eventViewSchema.index({ userId: 1, eventId: 1 }, { unique: true });

const EventView = mongoose.models.Event_Views || mongoose.model<IEventView>('Event_Views', eventViewSchema);

export default EventView;
