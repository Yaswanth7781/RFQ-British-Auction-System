const mongoose = require('mongoose');

const AuctionConfigSchema = new mongoose.Schema({
  rfqId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RFQ',
    required: true,
    unique: true,
  },
  triggerWindow: {
    type: Number, // in minutes
    required: [true, 'Please add trigger window in minutes'],
    default: 5,
  },
  extensionDuration: {
    type: Number, // in minutes
    required: [true, 'Please add extension duration in minutes'],
    default: 5,
  },
  triggerType: {
    type: String,
    enum: ['Bid Received', 'Any Rank Change', 'Lowest Bidder Change'],
    required: [true, 'Please specify trigger type'],
    default: 'Bid Received',
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('AuctionConfig', AuctionConfigSchema);
