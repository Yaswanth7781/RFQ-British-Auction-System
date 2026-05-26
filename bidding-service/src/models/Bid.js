const mongoose = require('mongoose');

const BidSchema = new mongoose.Schema({
  rfqId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  sellerName: {
    type: String,
    required: true,
  },
  freightCharges: {
    type: Number,
    required: [true, 'Please add freight charges'],
  },
  originCharges: {
    type: Number,
    required: [true, 'Please add origin charges'],
  },
  destinationCharges: {
    type: Number,
    required: [true, 'Please add destination charges'],
  },
  totalAmount: {
    type: Number,
    required: true,
  },
  transitTime: {
    type: Number, // in days
    required: [true, 'Please add transit time in days'],
  },
  validity: {
    type: Date,
    required: [true, 'Please add bid validity date'],
  },
}, {
  timestamps: true,
});

// Pre-save middleware to calculate totalAmount
BidSchema.pre('validate', function (next) {
  this.totalAmount = this.freightCharges + this.originCharges + this.destinationCharges;
  next();
});

module.exports = mongoose.model('Bid', BidSchema);
