const express = require('express');
const { getNearbyPlaces, getAutocompleteSuggestions } = require('../controllers/placeController');

const router = express.Router();

router.post('/nearby', getNearbyPlaces);
router.get('/autocomplete', getAutocompleteSuggestions);

module.exports = router;

