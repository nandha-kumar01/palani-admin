import mongoose from 'mongoose';

export interface IState {
  _id?: string;
  serialNo: number;
  name: string;
  code: string;
  countryId: string;
  countryName: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const stateSchema = new mongoose.Schema({
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
  code: {
    type: String,
    required: true,
    trim: true,
    uppercase: true
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
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for better query performance
stateSchema.index({ countryId: 1 });
stateSchema.index({ name: 1 });
// Note: serialNo index is already created by unique: true in schema definition

const State = mongoose.models.State || mongoose.model('State', stateSchema);

export default State;
