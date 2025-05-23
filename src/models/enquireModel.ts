import mongoose, { Document, Schema } from 'mongoose';

export interface IEnquiry extends Document {
  name?: string;
  phone?: string;
  serviceId?: string;
  providerId?: string;
  city?: string;
  state?: string;
  createdAt: Date;
}

const enquiryScheme = new Schema<IEnquiry>({
  name: {
    required: false,
    type: String
  },
  phone: {
    required: false,
    type: String
  },
  serviceId: {
    required: false,
    type: String,
  },
  providerId: {
    required: false,
    type: String
  },
  city: {
    required: false,
    type: String,
  },
  state: {
    required: false,
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
}, { collection: 'Enquiry' });

const Enquiry = mongoose.models.Enquiry || mongoose.model<IEnquiry>('Enquiry', enquiryScheme);

export default Enquiry;
