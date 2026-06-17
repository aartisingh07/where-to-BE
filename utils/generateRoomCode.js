const Room = require('../models/Room');

const generateRoomCode = async () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No confusing chars (0,O,I,1)
  let code;
  let exists = true;

  while (exists) {
    code = Array.from({ length: 6 }, () =>
      chars[Math.floor(Math.random() * chars.length)]
    ).join('');

    exists = await Room.findOne({ code, isActive: true });
  }

  return code;
};

module.exports = { generateRoomCode };
