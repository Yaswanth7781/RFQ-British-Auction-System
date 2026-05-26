const RFQ = require('../models/RFQ');
const AuctionConfig = require('../models/AuctionConfig');
const axios = require('axios');

// Helper to check and update RFQ status based on current time
const checkAndUpdateStatus = async (rfq) => {
  const now = new Date();
  let updated = false;

  if (rfq.status === 'Active') {
    if (now >= new Date(rfq.forcedCloseTime)) {
      rfq.status = 'Force Closed';
      updated = true;
    } else if (now >= new Date(rfq.bidCloseTime)) {
      rfq.status = 'Closed';
      updated = true;
    }
  }

  if (updated) {
    await rfq.save();
    
    // Log activity in notification service
    try {
      await axios.post(`${process.env.NOTIFICATION_SERVICE_URL}/api/notifications/activity`, {
        rfqId: rfq._id,
        actionType: 'Status Change',
        description: `RFQ status dynamically updated to ${rfq.status} due to time expiration.`
      });
    } catch (err) {
      console.error('Notification log failed:', err.message);
    }
  }
  return rfq;
};

// @desc    Create new RFQ and Config
// @route   POST /api/rfq/create
// @access  Private (Buyer only)
exports.createRFQ = async (req, res) => {
  try {
    const {
      rfqName,
      referenceId,
      bidStartTime,
      bidCloseTime,
      forcedCloseTime,
      pickupDate,
      triggerWindow,
      extensionDuration,
      triggerType
    } = req.body;

    // Validations
    if (!rfqName || !referenceId || !bidStartTime || !bidCloseTime || !forcedCloseTime || !pickupDate) {
      return res.status(400).json({ success: false, message: 'Please provide all RFQ fields' });
    }

    const start = new Date(bidStartTime);
    const close = new Date(bidCloseTime);
    const forced = new Date(forcedCloseTime);

    if (close <= start) {
      return res.status(400).json({ success: false, message: 'Bid Close Time must be after Bid Start Time' });
    }

    if (forced <= close) {
      return res.status(400).json({ success: false, message: 'Forced Close Time must be after Bid Close Time' });
    }

    // Check unique reference ID
    const rfqExists = await RFQ.findOne({ referenceId });
    if (rfqExists) {
      return res.status(400).json({ success: false, message: 'RFQ Reference ID already exists' });
    }

    // Create RFQ
    const rfq = await RFQ.create({
      rfqName,
      referenceId,
      bidStartTime: start,
      bidCloseTime: close,
      forcedCloseTime: forced,
      pickupDate: new Date(pickupDate),
      buyerId: req.user.id,
      status: 'Active'
    });

    // Create Auction Config
    const config = await AuctionConfig.create({
      rfqId: rfq._id,
      triggerWindow: triggerWindow || 5,
      extensionDuration: extensionDuration || 5,
      triggerType: triggerType || 'Bid Received'
    });

    // Log Activity in Notification Service
    try {
      await axios.post(`${process.env.NOTIFICATION_SERVICE_URL}/api/notifications/activity`, {
        rfqId: rfq._id,
        actionType: 'Creation',
        description: `RFQ '${rfqName}' was created by ${req.user.name}`
      });
    } catch (err) {
      console.error('Notification log failed:', err.message);
    }

    res.status(201).json({
      success: true,
      data: {
        rfq,
        config
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Get all RFQs
// @route   GET /api/rfq/list
// @access  Private (Buyer and Seller)
exports.listRFQs = async (req, res) => {
  try {
    const rfqs = await RFQ.find({});
    
    // Dynamically update and return all RFQs
    const updatedRfqs = await Promise.all(rfqs.map(checkAndUpdateStatus));

    res.json({
      success: true,
      count: updatedRfqs.length,
      data: updatedRfqs
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Get single RFQ & Config
// @route   GET /api/rfq/:id
// @access  Private
exports.getRFQ = async (req, res) => {
  try {
    let rfq = await RFQ.findById(req.params.id);
    if (!rfq) {
      return res.status(404).json({ success: false, message: 'RFQ not found' });
    }

    // Dynamic status evaluation
    rfq = await checkAndUpdateStatus(rfq);

    const config = await AuctionConfig.findOne({ rfqId: rfq._id });

    res.json({
      success: true,
      data: {
        rfq,
        config
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Update RFQ status/details
// @route   PUT /api/rfq/:id
// @access  Private (Buyer only)
exports.updateRFQ = async (req, res) => {
  try {
    let rfq = await RFQ.findById(req.params.id);
    if (!rfq) {
      return res.status(404).json({ success: false, message: 'RFQ not found' });
    }

    if (rfq.buyerId.toString() !== req.user.id && req.user.role !== 'buyer') {
      return res.status(403).json({ success: false, message: 'Not authorized to edit this RFQ' });
    }

    const { status, rfqName, pickupDate } = req.body;
    
    if (status) rfq.status = status;
    if (rfqName) rfq.rfqName = rfqName;
    if (pickupDate) rfq.pickupDate = new Date(pickupDate);

    await rfq.save();

    res.json({
      success: true,
      data: rfq
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Internal Endpoint to extend RFQ time
// @route   PUT /api/rfq/internal/extend/:id
// @access  Private (Usually called by bidding-service)
exports.extendRFQ = async (req, res) => {
  try {
    const { bidCloseTime } = req.body;
    if (!bidCloseTime) {
      return res.status(400).json({ success: false, message: 'Please provide new bid close time' });
    }

    let rfq = await RFQ.findById(req.params.id);
    if (!rfq) {
      return res.status(404).json({ success: false, message: 'RFQ not found' });
    }

    if (rfq.status !== 'Active') {
      return res.status(400).json({ success: false, message: `Cannot extend RFQ since status is ${rfq.status}` });
    }

    const newClose = new Date(bidCloseTime);
    const forced = new Date(rfq.forcedCloseTime);

    if (newClose > forced) {
      rfq.bidCloseTime = forced;
    } else {
      rfq.bidCloseTime = newClose;
    }

    await rfq.save();

    // Log Activity in Notification Service
    try {
      await axios.post(`${process.env.NOTIFICATION_SERVICE_URL}/api/notifications/activity`, {
        rfqId: rfq._id,
        actionType: 'Extension',
        description: `RFQ Close Time extended to ${rfq.bidCloseTime.toISOString()}`
      });
    } catch (err) {
      console.error('Notification log failed:', err.message);
    }

    res.json({
      success: true,
      message: 'RFQ extended successfully',
      data: rfq
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};
