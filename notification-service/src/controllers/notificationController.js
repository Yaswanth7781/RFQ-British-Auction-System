const ActivityLog = require('../models/ActivityLog');
const Notification = require('../models/Notification');

// @desc    Log a system activity
// @route   POST /api/notifications/activity
// @access  Private (Internal Service API)
exports.logActivity = async (req, res) => {
  try {
    const { rfqId, actionType, description } = req.body;
    if (!rfqId || !actionType || !description) {
      return res.status(400).json({ success: false, message: 'Please provide rfqId, actionType and description' });
    }

    const log = await ActivityLog.create({
      rfqId,
      actionType,
      description
    });

    res.status(201).json({
      success: true,
      data: log
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Get activity logs for an RFQ
// @route   GET /api/activity/:rfqId
// @access  Private
exports.getActivityLogs = async (req, res) => {
  try {
    const { rfqId } = req.params;
    const logs = await ActivityLog.find({ rfqId }).sort({ timestamp: -1 });
    res.json({
      success: true,
      count: logs.length,
      data: logs
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Create a user notification
// @route   POST /api/notifications
// @access  Private (Internal Service API)
exports.createNotification = async (req, res) => {
  try {
    const { userId, role, message } = req.body;
    if (!userId || !role || !message) {
      return res.status(400).json({ success: false, message: 'Please provide userId, role, and message' });
    }

    const notification = await Notification.create({
      userId,
      role,
      message
    });

    res.status(201).json({
      success: true,
      data: notification
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Get all notifications for logged-in user
// @route   GET /api/notifications
// @access  Private
exports.getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Find notifications
    const notifications = await Notification.find({ userId }).sort({ createdAt: -1 });

    // Mark them as read
    if (notifications.length > 0) {
      await Notification.updateMany({ userId, isRead: false }, { isRead: true });
    }

    res.json({
      success: true,
      count: notifications.length,
      data: notifications
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};
