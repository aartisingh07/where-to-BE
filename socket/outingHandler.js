const axios = require('axios');

// Map: roomId → Map(userId → { lat, lng, mood, distance, username })
const roomPreferences = new Map();

// Helper to calculate distance in km
const getDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const moodToCategories = {
  chill:     'catering.cafe,leisure.park,beach,tourism.attraction.viewpoint,natural.water',
  foodie:    'catering.restaurant,catering.cafe,catering.fast_food,catering.food_court,commercial.food_and_drink.bakery',
  adventure: 'tourism.attraction,sport.sports_centre,natural.mountain.peak,beach,tourism.attraction.viewpoint',
  romantic:  'tourism.attraction.viewpoint,catering.restaurant,beach,leisure.park,natural.water',
  study:     'catering.cafe,education.library,education.university',
};

const categoryToLabel = {
  'catering.cafe':                          'Cafe',
  'catering.restaurant':                    'Restaurant',
  'catering.fast_food':                     'Fast Food',
  'catering.food_court':                    'Food Court',
  'commercial.food_and_drink.bakery':       'Bakery',
  'leisure.park':                           'Park',
  'beach':                                  'Beach',
  'natural.water':                          'Lake / Water',
  'natural.mountain.peak':                  'Viewpoint',
  'tourism.attraction.viewpoint':           'Viewpoint',
  'tourism.attraction':                     'Attraction',
  'sport.sports_centre':                    'Sports',
  'education.library':                      'Library',
  'education.university':                   'Study Space',
};

const getLabel = (categories = []) => {
  for (const cat of categories) {
    if (categoryToLabel[cat]) return categoryToLabel[cat];
    const match = Object.keys(categoryToLabel).find((k) => cat.startsWith(k));
    if (match) return categoryToLabel[match];
  }
  return 'Place';
};

const setupOutingHandler = (socket, io) => {
  const getSubmissionsList = (roomId) => {
    const prefs = roomPreferences.get(roomId);
    if (!prefs) return [];
    return Array.from(prefs.entries()).map(([userId, val]) => ({
      userId,
      username: val.username,
      hasSubmitted: true,
      mood: val.mood,
    }));
  };

  // Sync state on join
  socket.on('get-outing-state', ({ roomId }) => {
    if (!roomId) return;
    socket.emit('outing-state-update', {
      submissions: getSubmissionsList(roomId),
    });
  });

  // Submit preferences
  socket.on('submit-outing-pref', ({ roomId, pref }) => {
    if (!roomId || !pref) return;

    if (!roomPreferences.has(roomId)) {
      roomPreferences.set(roomId, new Map());
    }

    roomPreferences.get(roomId).set(socket.userId, {
      lat: Number(pref.lat),
      lng: Number(pref.lng),
      mood: pref.mood || 'chill',
      distance: Number(pref.distance) || 5000,
      username: socket.username,
    });

    io.to(roomId).emit('outing-state-update', {
      submissions: getSubmissionsList(roomId),
    });

    console.log(`📍 Preference submitted by ${socket.username} in room ${roomId}`);
  });

  // Find places based on midpoint aggregation (host only)
  socket.on('find-outing-places', async ({ roomId }) => {
    if (!roomId) return;
    const prefs = roomPreferences.get(roomId);

    if (!prefs || prefs.size === 0) {
      return socket.emit('outing-error', { message: 'No locations submitted yet!' });
    }

    // Calculate midpoint centroid
    let latSum = 0;
    let lngSum = 0;
    let distSum = 0;
    const moods = [];

    for (const userPref of prefs.values()) {
      latSum += userPref.lat;
      lngSum += userPref.lng;
      distSum += userPref.distance;
      moods.push(userPref.mood);
    }

    const count = prefs.size;
    const midLat = latSum / count;
    const midLng = lngSum / count;
    const avgDist = distSum / count;

    // Get mode mood (most frequent)
    const moodCounts = {};
    let modeMood = 'chill';
    let maxCount = 0;
    moods.forEach((m) => {
      moodCounts[m] = (moodCounts[m] || 0) + 1;
      if (moodCounts[m] > maxCount) {
        maxCount = moodCounts[m];
        modeMood = m;
      }
    });

    const apiKey = process.env.GEOAPIFY_API_KEY;
    if (!apiKey) {
      return io.to(roomId).emit('outing-error', { message: 'Geoapify API key not configured on server.' });
    }

    try {
      const categories = moodToCategories[modeMood] || moodToCategories['chill'];

      const response = await axios.get('https://api.geoapify.com/v2/places', {
        params: {
          categories,
          filter: `circle:${midLng},${midLat},${Math.round(avgDist)}`,
          bias: `proximity:${midLng},${midLat}`,
          limit: 30,
          apiKey,
        },
        timeout: 15000,
      });

      const features = response.data?.features || [];

      const places = features
        .map((feature) => {
          const props = feature.properties;
          const name = props.name;
          if (!name) return null;

          const placeLat = props.lat;
          const placeLng = props.lon;
          const dist = getDistance(midLat, midLng, placeLat, placeLng);

          return {
            osmId: props.place_id || `${placeLat}-${placeLng}`,
            name,
            category: getLabel(props.categories || []),
            lat: placeLat,
            lng: placeLng,
            distance: Math.round(dist * 10) / 10, // distance from midpoint
            address: props.formatted || [
              props.address_line1,
              props.address_line2,
            ].filter(Boolean).join(', '),
            phone: props.contact?.phone || null,
            website: props.website || null,
          };
        })
        .filter(Boolean)
        .filter((place, index, self) =>
          index === self.findIndex((p) => p.name === place.name)
        )
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 12);

      io.to(roomId).emit('outing-places-found', {
        places,
        midpoint: { lat: midLat, lng: midLng },
        mood: modeMood,
        radius: Math.round(avgDist),
      });

      console.log(`📍 Centroid Midpoint: (${midLat}, ${midLng}), found ${places.length} places for room ${roomId}`);
    } catch (error) {
      console.error('❌ Outing places lookup failed:', error.message);
      io.to(roomId).emit('outing-error', { message: 'Failed to search places. Try again.' });
    }
  });

  // Clear preferences (host resets activity)
  socket.on('clear-outing-state', ({ roomId }) => {
    if (!roomId) return;
    roomPreferences.delete(roomId);
    io.to(roomId).emit('outing-state-update', { submissions: [] });
  });
};

module.exports = setupOutingHandler;
