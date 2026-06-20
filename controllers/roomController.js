const Room = require('../models/Room');
const Message = require('../models/Message');
const { generateRoomCode } = require('../utils/generateRoomCode');

// @desc    Create a new room
// @route   POST /api/rooms/create
// @access  Private
const createRoom = async (req, res, next) => {
  try {
    const { name } = req.body;
    const code = await generateRoomCode();

    const room = await Room.create({
      code,
      name: name || `${req.user.username}'s Room`,
      host: req.user.id,
      members: [req.user.id],
    });

    await room.populate('host', 'username avatar');
    await room.populate('members', 'username avatar');

    res.status(201).json(room);
  } catch (error) {
    next(error);
  }
};

// @desc    Join a room by code
// @route   POST /api/rooms/join
// @access  Private
const joinRoom = async (req, res, next) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ message: 'Room code is required' });
    }

    const room = await Room.findOne({
      code: code.toUpperCase(),
      isActive: true,
    })
      .populate('host', 'username avatar')
      .populate('members', 'username avatar');

    if (!room) {
      return res.status(404).json({ message: 'Room not found or has expired' });
    }

    // Add user if not already a member
    const isMember = room.members.some(
      (m) => m._id.toString() === req.user.id
    );
    if (!isMember) {
      room.members.push(req.user.id);
      await room.save();
      await room.populate('members', 'username avatar');
    }

    res.json(room);
  } catch (error) {
    next(error);
  }
};

// @desc    Get room details
// @route   GET /api/rooms/:id
// @access  Private
const getRoom = async (req, res, next) => {
  try {
    const room = await Room.findById(req.params.id)
      .populate('host', 'username avatar')
      .populate('members', 'username avatar');

    if (!room || !room.isActive) {
      return res.status(404).json({ message: 'Room not found' });
    }

    res.json(room);
  } catch (error) {
    next(error);
  }
};

// @desc    Set room activity (host only)
// @route   PATCH /api/rooms/:id/activity
// @access  Private
const setActivity = async (req, res, next) => {
  try {
    const { activity } = req.body;
    const room = await Room.findById(req.params.id);

    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    if (room.host.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only the host can change the activity' });
    }

    room.activity = activity;
    await room.save();

    res.json({ activity: room.activity });
  } catch (error) {
    next(error);
  }
};

// @desc    Get room messages
// @route   GET /api/rooms/:id/messages
// @access  Private
const getMessages = async (req, res, next) => {
  try {
    const messages = await Message.find({ room: req.params.id })
      .sort({ createdAt: 1 })
      .limit(100)
      .lean();

    res.json(messages);
  } catch (error) {
    next(error);
  }
};

// @desc    Leave a room
// @route   POST /api/rooms/:id/leave
// @access  Private
const leaveRoom = async (req, res, next) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ message: 'Room not found' });

    room.members = room.members.filter(
      (m) => m.toString() !== req.user.id
    );

    await room.save();
    res.json({ message: 'Left room' });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a room (host only)
// @route   DELETE /api/rooms/:id
// @access  Private
const deleteRoom = async (req, res, next) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    if (room.host.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only the host can delete the room' });
    }

    room.isActive = false;
    await room.save();

    res.json({ message: 'Room deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createRoom,
  joinRoom,
  getRoom,
  setActivity,
  getMessages,
  leaveRoom,
  deleteRoom,
};
