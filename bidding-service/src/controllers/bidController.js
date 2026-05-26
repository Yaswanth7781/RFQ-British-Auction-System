const Bid = require('../models/Bid');
const axios = require('axios');

// Helper to calculate rankings of sellers for a given RFQ
const calculateRankings = async (rfqId) => {
  const bids = await Bid.find({ rfqId });
  const sellerBestBids = {};

  // Group by sellerId and find their lowest totalAmount bid
  bids.forEach(bid => {
    const sId = bid.sellerId.toString();
    if (!sellerBestBids[sId] || bid.totalAmount < sellerBestBids[sId].totalAmount) {
      sellerBestBids[sId] = bid;
    }
  });

  // Sort best bids by totalAmount ascending
  const sortedBids = Object.values(sellerBestBids).sort((a, b) => a.totalAmount - b.totalAmount);

  // Return ranked array
  return sortedBids.map((bid, index) => ({
    rank: index + 1, // L1, L2, L3...
    sellerId: bid.sellerId,
    sellerName: bid.sellerName,
    totalAmount: bid.totalAmount,
    bidId: bid._id,
    createdAt: bid.createdAt
  }));
};

// Helper to project rankings with an incoming bid (in-memory)
const projectRankings = (currentRankings, newBid) => {
  const sellerMap = {};
  
  // Initialize with current rankings
  currentRankings.forEach(r => {
    sellerMap[r.sellerId.toString()] = {
      totalAmount: r.totalAmount,
      sellerName: r.sellerName
    };
  });

  // Update or insert the new bid for this seller
  const sId = newBid.sellerId.toString();
  if (!sellerMap[sId] || newBid.totalAmount < sellerMap[sId].totalAmount) {
    sellerMap[sId] = {
      totalAmount: newBid.totalAmount,
      sellerName: newBid.sellerName
    };
  }

  // Sort by totalAmount ascending
  const sorted = Object.entries(sellerMap)
    .map(([id, info]) => ({
      sellerId: id,
      sellerName: info.sellerName,
      totalAmount: info.totalAmount
    }))
    .sort((a, b) => a.totalAmount - b.totalAmount);

  // Project ranks
  return sorted.map((s, index) => ({
    rank: index + 1,
    sellerId: s.sellerId,
    sellerName: s.sellerName,
    totalAmount: s.totalAmount
  }));
};

// @desc    Submit a new bid
// @route   POST /api/bid/create
// @access  Private (Seller only)
exports.createBid = async (req, res) => {
  try {
    const { rfqId, freightCharges, originCharges, destinationCharges, transitTime, validity } = req.body;
    const sellerId = req.user.id;
    const sellerName = req.user.name;

    if (!rfqId || freightCharges === undefined || originCharges === undefined || destinationCharges === undefined || !transitTime || !validity) {
      return res.status(400).json({ success: false, message: 'Please provide all bidding fields' });
    }

    const calculatedTotal = Number(freightCharges) + Number(originCharges) + Number(destinationCharges);

    // 1. Fetch RFQ details and Auction Config from RFQ Service
    let rfqDetails;
    try {
      const response = await axios.get(`${process.env.RFQ_SERVICE_URL}/api/rfq/${rfqId}`, {
        headers: { Authorization: req.headers.authorization }
      });
      rfqDetails = response.data.data;
    } catch (err) {
      console.error('RFQ Fetch failed:', err.message);
      return res.status(404).json({ success: false, message: 'Failed to retrieve RFQ details from RFQ Service.' });
    }

    const { rfq, config } = rfqDetails;
    const now = new Date();
    const bidStartTime = new Date(rfq.bidStartTime);
    const bidCloseTime = new Date(rfq.bidCloseTime);
    const forcedCloseTime = new Date(rfq.forcedCloseTime);

    // 2. Validate timing bounds and status
    if (rfq.status === 'Force Closed' || now >= forcedCloseTime) {
      return res.status(400).json({ success: false, message: 'RFQ Auction is Force Closed. No more bids are accepted.' });
    }

    if (rfq.status === 'Closed' || now >= bidCloseTime) {
      return res.status(400).json({ success: false, message: 'RFQ Auction is Closed.' });
    }

    if (now < bidStartTime) {
      return res.status(400).json({ success: false, message: 'RFQ Auction has not started yet.' });
    }

    // 3. Enforce price reduction rule (seller's new bid must be lower than their previous lowest bid)
    const previousBids = await Bid.find({ rfqId, sellerId });
    if (previousBids.length > 0) {
      const currentLowest = Math.min(...previousBids.map(b => b.totalAmount));
      if (calculatedTotal >= currentLowest) {
        return res.status(400).json({
          success: false,
          message: `Price reduction rule violated. Your new bid total ($${calculatedTotal}) must be lower than your current lowest bid ($${currentLowest}).`
        });
      }
    }

    // 4. Check if in Trigger Window and determine extension triggers
    const triggerWindowMs = config.triggerWindow * 60 * 1000;
    const windowStart = new Date(bidCloseTime.getTime() - triggerWindowMs);

    let shouldExtend = false;
    let extensionReason = '';

    if (now >= windowStart && now <= bidCloseTime) {
      console.log('Bid received in trigger window! Evaluating extension...');

      if (config.triggerType === 'Bid Received') {
        shouldExtend = true;
        extensionReason = 'Bid received in trigger window';
      } else {
        // Calculate rankings before this bid
        const currentRankings = await calculateRankings(rfqId);
        // Calculate projected rankings with this bid
        const projectedRankings = projectRankings(currentRankings, {
          sellerId,
          sellerName,
          totalAmount: calculatedTotal
        });

        if (config.triggerType === 'Lowest Bidder Change') {
          // L1 changed if:
          // a) No previous bids existed
          // b) The L1 seller is now different
          if (currentRankings.length === 0) {
            shouldExtend = true;
            extensionReason = 'New L1 bidder established (first bid)';
          } else if (currentRankings[0].sellerId.toString() !== projectedRankings[0].sellerId.toString()) {
            shouldExtend = true;
            extensionReason = `L1 bidder changed from ${currentRankings[0].sellerName} to ${projectedRankings[0].sellerName}`;
          }
        } else if (config.triggerType === 'Any Rank Change') {
          // Rank changed if:
          // a) Number of bidders changed (first bid from a seller)
          // b) The exact sequence of sellerIds changed
          if (currentRankings.length !== projectedRankings.length) {
            shouldExtend = true;
            extensionReason = 'Supplier rankings changed (new participant entered)';
          } else {
            for (let i = 0; i < currentRankings.length; i++) {
              if (currentRankings[i].sellerId.toString() !== projectedRankings[i].sellerId.toString()) {
                shouldExtend = true;
                extensionReason = 'Supplier rankings changed';
                break;
              }
            }
          }
        }
      }
    }

    // 5. Apply extensions if triggered
    let updatedRfqData = null;
    if (shouldExtend) {
      const extensionDurationMs = config.extensionDuration * 60 * 1000;
      let newCloseTime = new Date(bidCloseTime.getTime() + extensionDurationMs);

      if (newCloseTime > forcedCloseTime) {
        newCloseTime = forcedCloseTime;
      }

      if (newCloseTime > bidCloseTime) {
        console.log(`Extending RFQ Close Time to: ${newCloseTime.toISOString()}`);
        try {
          const extensionResp = await axios.put(
            `${process.env.RFQ_SERVICE_URL}/api/rfq/internal/extend/${rfqId}`,
            { bidCloseTime: newCloseTime.toISOString() },
            { headers: { Authorization: req.headers.authorization } }
          );
          updatedRfqData = extensionResp.data.data;
          
          // Send notification alert to Notification Service
          await axios.post(`${process.env.NOTIFICATION_SERVICE_URL}/api/notifications`, {
            userId: rfq.buyerId,
            role: 'buyer',
            message: `RFQ '${rfq.rfqName}' has been extended to ${newCloseTime.toLocaleTimeString()} due to: ${extensionReason}`
          }, { headers: { Authorization: req.headers.authorization } });

        } catch (err) {
          console.error('Failed to notify RFQ extension:', err.message);
        }
      }
    }

    // 6. Create the bid
    const bid = await Bid.create({
      rfqId,
      sellerId,
      sellerName,
      freightCharges: Number(freightCharges),
      originCharges: Number(originCharges),
      destinationCharges: Number(destinationCharges),
      transitTime: Number(transitTime),
      validity: new Date(validity)
    });

    // 7. Log bid placement activity in Notification Service
    try {
      await axios.post(`${process.env.NOTIFICATION_SERVICE_URL}/api/notifications/activity`, {
        rfqId,
        actionType: 'Bid Placed',
        description: `Supplier '${sellerName}' submitted a bid of $${bid.totalAmount} (Transit: ${transitTime} days)`
      });
    } catch (err) {
      console.error('Failed to log activity:', err.message);
    }

    res.status(201).json({
      success: true,
      message: 'Bid submitted successfully',
      data: {
        bid,
        rfqExtended: !!updatedRfqData,
        newCloseTime: updatedRfqData ? updatedRfqData.bidCloseTime : null
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Get all bids for an RFQ (Sorted by lowest price)
// @route   GET /api/bid/list/:rfqId
// @access  Private
exports.getBidsByRFQ = async (req, res) => {
  try {
    const { rfqId } = req.params;
    const bids = await Bid.find({ rfqId }).sort({ totalAmount: 1 });
    res.json({
      success: true,
      count: bids.length,
      data: bids
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Get supplier rankings for an RFQ (L1, L2, L3)
// @route   GET /api/bid/rank/:rfqId
// @access  Private
exports.getRFQRankings = async (req, res) => {
  try {
    const { rfqId } = req.params;
    const rankings = await calculateRankings(rfqId);
    res.json({
      success: true,
      data: rankings
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};
