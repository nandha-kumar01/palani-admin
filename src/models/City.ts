import mongoose from 'mongoose';

export interface ICity {
  _id?: string;
  serialNo: number;
  name: string;
  stateId: string;
  stateName: string;
  stateCode?: string;
  countryId: string;
  countryName: string;
  countryCode?: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const citySchema = new mongoose.Schema({
  serialNo: {
    type: Number,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  stateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'State',
    required: true
  },
  stateName: {
    type: String,
    required: true
  },
  stateCode: {
    type: String,
    trim: true
  },
  countryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Country',
    required: true
  },
  countryName: {
    type: String,
    required: true
  },
  countryCode: {
    type: String,
    trim: true
  },
  latitude: {
    type: Number,
    default: null
  },
  longitude: {
    type: Number,
    default: null
  },
  timezone: {
    type: String,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes for better query performance
citySchema.index({ stateId: 1 });
citySchema.index({ countryId: 1 });
citySchema.index({ name: 1 });
// Note: serialNo index is already created by unique: true in schema definition
citySchema.index({ name: 1, stateId: 1 }, { unique: true }); // Prevent duplicate city names within the same state

const City = mongoose.models.City || mongoose.model('City', citySchema);

export default City;