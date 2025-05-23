import mongoose, { Document, Schema } from 'mongoose';

export interface IContactUs extends Document {
  name?: string;
  email?: string;
  phone?: string;
  message?: string;
  createdAt: Date;
}

const contactUsSchema = new Schema<IContactUs>({
  name: {
    required: false,
    type: String,
  },
  email: {
    required: false,
    type: String,
  },
  phone: {
    required: false,
    type: String,
  },
  message: {
    required: false,
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
}, { collection: 'Contact_Us' });

const ContactUs = mongoose.models.Contact_Us || mongoose.model<IContactUs>('Contact_Us', contactUsSchema);

export default ContactUs;
