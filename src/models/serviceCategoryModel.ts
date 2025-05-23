import mongoose, { Document, Schema } from 'mongoose';

export interface IServiceCategory extends Document {
  userId: string;
  name?: string;
  createdAt: Date;
}

const serviceCategorySchema = new Schema<IServiceCategory>({
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
}, { collection: 'Service Category' });

const ServiceCategory = mongoose.models['Service Category'] || 
  mongoose.model<IServiceCategory>('Service Category', serviceCategorySchema);

export default ServiceCategory;
