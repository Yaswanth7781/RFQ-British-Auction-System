const express = require('express');
const router = express.Router();
const { createBid, getBidsByRFQ, getRFQRankings } = require('../controllers/bidController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/create', protect, authorize('seller'), createBid);
router.get('/list/:rfqId', protect, getBidsByRFQ);
router.get('/rank/:rfqId', protect, getRFQRankings);

module.exports = router;
