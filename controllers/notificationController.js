const Notification = require('../models/Notification');

const getNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(notifications);
  } catch (error) {
    next(error);
  }
};

const markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { isRead: true },
      { new: true }
    );
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    res.json(notification);
  } catch (error) {
    next(error);
  }
};

const clearNotifications = async (req, res, next) => {
  try {
    await Notification.deleteMany({ user: req.user.id });
    res.json({ message: 'All notifications cleared' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getNotifications, markAsRead, clearNotifications };
