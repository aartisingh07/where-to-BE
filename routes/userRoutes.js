const express = require('express');
const { savePlace, getSavedPlaces, deleteSavedPlace } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/places/save', protect, savePlace);
router.get('/places', protect, getSavedPlaces);
router.delete('/places/:id', protect, deleteSavedPlace);

module.exports = router;
