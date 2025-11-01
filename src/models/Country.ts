import mongoose from 'mongoose';

export interface ICountry {
  serialNo: number;
  name: string;
  code: string;
  dialingCode: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CountrySchema = new mongoose.Schema<ICountry>(
  {
    serialNo: {
      type: Number,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    dialingCode: {
      type: String,
      required: true,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes for better query performance
CountrySchema.index({ name: 1 });
// Note: code index is already created by unique: true in schema
CountrySchema.index({ dialingCode: 1 });
CountrySchema.index({ isActive: 1 });

export default mongoose.models.Country || mongoose.model<ICountry>('Country', CountrySchema);
