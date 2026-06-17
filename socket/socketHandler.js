const jwt = require('jsonwebtoken');
const Message = require('../models/Message');

// Map: roomId → Set of { socketId, userId, username, avatar }
const roomUsers = new Map();

const addUserToRoom = (roomId, socketId, userInfo) => {
  if (!roomUsers.has(roomId)) roomUsers.set(roomId, new Map());
  roomUsers.get(roomId).set(socketId, userInfo);
};

const removeUserFromRoom = (roomId, socketId) => {
  if (roomUsers.has(roomId)) {
    roomUsers.get(roomId).delete(socketId);
    if (roomUsers.get(roomId).size === 0) roomUsers.delete(roomId);
  }
};

const getRoomUsers = (roomId) => {
  if (!roomUsers.has(roomId)) return [];
  return Array.from(roomUsers.get(roomId).values());
};

const setupSocket = (io) => {
  // Auth middleware — verify JWT on every socket connection
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Authentication error: no token'));

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      socket.username = decoded.username;
      socket.avatar = decoded.avatar || '';
      next();
    } catch {
      next(new Error('Authentication error: invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.username} (${socket.id})`);

    // ── Join Room ──────────────────────────────────────────
    socket.on('join-room', async ({ roomId }) => {
      socket.join(roomId);
      socket.currentRoomId = roomId;

      addUserToRoom(roomId, socket.id, {
        userId: socket.userId,
        username: socket.username,
        avatar: socket.avatar,
        socketId: socket.id,
      });

      // Send system message
      const sysMsg = await Message.create({
        room: roomId,
        senderName: 'System',
        content: `${socket.username} joined the room 🎉`,
        type: 'system',
      });

      io.to(roomId).emit('new-message', sysMsg);
      io.to(roomId).emit('room-users-update', getRoomUsers(roomId));

      console.log(`👥 ${socket.username} joined room ${roomId}`);
    });

    // ── Send Message ───────────────────────────────────────
    socket.on('send-message', async ({ roomId, content }) => {
      if (!content?.trim()) return;

      const message = await Message.create({
        room: roomId,
        sender: socket.userId,
        senderName: socket.username,
        content: content.trim(),
        type: 'text',
      });

      io.to(roomId).emit('new-message', message);
    });

    // ── Activity Change ────────────────────────────────────
    socket.on('set-activity', ({ roomId, activity }) => {
      io.to(roomId).emit('activity-changed', { activity });
    });

    // ── Leave Room ─────────────────────────────────────────
    socket.on('leave-room', async ({ roomId }) => {
      await handleLeave(socket, roomId, io);
    });

    // ── Disconnect ─────────────────────────────────────────
    socket.on('disconnect', async () => {
      const roomId = socket.currentRoomId;
      if (roomId) await handleLeave(socket, roomId, io);
      console.log(`❌ Socket disconnected: ${socket.username} (${socket.id})`);
    });
  });
};

const handleLeave = async (socket, roomId, io) => {
  socket.leave(roomId);
  removeUserFromRoom(roomId, socket.id);

  const sysMsg = await Message.create({
    room: roomId,
    senderName: 'System',
    content: `${socket.username} left the room`,
    type: 'system',
  });

  io.to(roomId).emit('new-message', sysMsg);
  io.to(roomId).emit('room-users-update', getRoomUsers(roomId));
};

module.exports = setupSocket;
