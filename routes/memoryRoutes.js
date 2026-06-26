const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  upload,
  uploadMemory,
  getMemoriesByUserId,
  deleteMemory
} = require('../controllers/memoryController');

router.post('/', protect, upload.single('photo'), uploadMemory);
router.get('/user/:userId', protect, getMemoriesByUserId);
router.delete('/:id', protect, deleteMemory);

module.exports = router;
