const express = require('express');
const { getNearbyPlaces } = require('../controllers/placeController');

const router = express.Router();

router.post('/nearby', getNearbyPlaces);

module.exports = router;
