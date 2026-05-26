const mongoose = require('mongoose');

const ActivityLogSchema = new mongoose.Schema({
  rfqId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  actionType: {
    type: String,
    enum: ['Bid Placed', 'Extension', 'Status Change', 'Creation'],
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('ActivityLog', ActivityLogSchema);
