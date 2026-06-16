const crypto = require('crypto');

/**
 * Generate a unique 6-character room code (uppercase alphanumeric).
 * Avoids ambiguous characters: 0, O, I, L, 1
 */
const generateRoomCode = () => {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let code = '';
  const bytes = crypto.randomBytes(6);
  for (let i = 0; i < 6; i++) {
    code += chars[bytes[i] % chars.length];
  }
  return code;
};

module.exports = generateRoomCode;
