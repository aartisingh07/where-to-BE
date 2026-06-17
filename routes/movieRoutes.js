const express = require('express');
const { discoverMovies, getWatchProviders } = require('../controllers/movieController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/discover', protect, discoverMovies);
router.get('/providers/:id', protect, getWatchProviders);

module.exports = router;
