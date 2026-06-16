const SavedPlace = require('../models/SavedPlace');
const User = require('../models/User');

// @desc    Save a place to user's profile
// @route   POST /api/user/places/save
// @access  Private
const savePlace = async (req, res, next) => {
  try {
    const { name, category, lat, lng, osmId, address } = req.body;

    if (!name || !lat || !lng) {
      return res.status(400).json({ message: 'Name and coordinates are required' });
    }

    // Check if already saved
    const existing = await SavedPlace.findOne({ user: req.user.id, osmId });
    if (existing) {
      return res.status(400).json({ message: 'Place already saved!' });
    }

    const place = await SavedPlace.create({
      user: req.user.id,
      name,
      category,
      lat,
      lng,
      osmId,
      address,
    });

    res.status(201).json(place);
  } catch (error) {
    next(error);
  }
};

// @desc    Get all saved places for user
// @route   GET /api/user/places
// @access  Private
const getSavedPlaces = async (req, res, next) => {
  try {
    const places = await SavedPlace.find({ user: req.user.id }).sort({ savedAt: -1 });
    res.json(places);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a saved place
// @route   DELETE /api/user/places/:id
// @access  Private
const deleteSavedPlace = async (req, res, next) => {
  try {
    const place = await SavedPlace.findById(req.params.id);

    if (!place) {
      return res.status(404).json({ message: 'Place not found' });
    }

    if (place.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this place' });
    }

    await place.deleteOne();
    res.json({ message: 'Place removed', id: req.params.id });
  } catch (error) {
    next(error);
  }
};

module.exports = { savePlace, getSavedPlaces, deleteSavedPlace };
