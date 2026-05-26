const express = require('express');
const router = express.Router();
const { logActivity, getActivityLogs, createNotification, getNotifications } = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');

// Activity Log Routes
router.post('/activity', logActivity);
router.post('/notifications/activity', logActivity); // support alternate style
router.get('/activity/:rfqId', protect, getActivityLogs);

// Notification Routes
router.post('/notifications', createNotification);
router.get('/notifications', protect, getNotifications);

module.exports = router;
