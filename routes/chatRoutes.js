const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  searchUsers,
  sendChatRequest,
  handleChatRequest,
  getActiveChats,
  getPendingRequests,
  getMessageHistory,
  sendDirectMessage,
  getUnreadCount,
  markMessagesAsRead
} = require('../controllers/chatController');

router.get('/search', protect, searchUsers);
router.post('/request', protect, sendChatRequest);
router.post('/request/:requestId', protect, handleChatRequest);
router.get('/active', protect, getActiveChats);
router.get('/requests', protect, getPendingRequests);
router.get('/unread-count', protect, getUnreadCount);
router.post('/mark-read/:senderId', protect, markMessagesAsRead);
router.get('/messages/:otherUserId', protect, getMessageHistory);
router.post('/messages/:otherUserId', protect, sendDirectMessage);

module.exports = router;
