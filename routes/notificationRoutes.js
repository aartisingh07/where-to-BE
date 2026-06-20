const express = require('express');
const router = express.Router();
const { getNotifications, markAsRead, clearNotifications } = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getNotifications);
router.patch('/:id/read', protect, markAsRead);
router.delete('/clear', protect, clearNotifications);

module.exports = router;
