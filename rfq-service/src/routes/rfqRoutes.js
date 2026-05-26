const express = require('express');
const router = express.Router();
const { createRFQ, listRFQs, getRFQ, updateRFQ, extendRFQ } = require('../controllers/rfqController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/create', protect, authorize('buyer'), createRFQ);
router.get('/list', protect, listRFQs);
router.get('/:id', protect, getRFQ);
router.put('/:id', protect, authorize('buyer'), updateRFQ);
router.put('/internal/extend/:id', protect, extendRFQ);

module.exports = router;
