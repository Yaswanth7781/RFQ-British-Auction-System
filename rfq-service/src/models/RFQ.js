const mongoose = require('mongoose');

const RFQSchema = new mongoose.Schema({
  rfqName: {
    type: String,
    required: [true, 'Please add RFQ name'],
    trim: true,
  },
  referenceId: {
    type: String,
    required: [true, 'Please add reference ID'],
    unique: true,
    trim: true,
  },
  bidStartTime: {
    type: Date,
    required: [true, 'Please add bid start time'],
  },
  bidCloseTime: {
    type: Date,
    required: [true, 'Please add bid close time'],
  },
  forcedCloseTime: {
    type: Date,
    required: [true, 'Please add forced close time'],
  },
  pickupDate: {
    type: Date,
    required: [true, 'Please add pickup date'],
  },
  buyerId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  status: {
    type: String,
    enum: ['Active', 'Closed', 'Force Closed'],
    default: 'Active',
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('RFQ', RFQSchema);
