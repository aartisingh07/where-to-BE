const express = require('express');
const {
  createRoom, joinRoom, getRoom,
  setActivity, getMessages, leaveRoom, deleteRoom,
} = require('../controllers/roomController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/create', protect, createRoom);
router.post('/join', protect, joinRoom);
router.get('/:id', protect, getRoom);
router.patch('/:id/activity', protect, setActivity);
router.get('/:id/messages', protect, getMessages);
router.post('/:id/leave', protect, leaveRoom);
router.delete('/:id', protect, deleteRoom);

module.exports = router;
