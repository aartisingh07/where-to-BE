const axios = require('axios');

// Genre mapping (TMDB genre IDs)
const GENRES = {
  action: 28,
  adventure: 12,
  animation: 16,
  comedy: 35,
  crime: 80,
  documentary: 99,
  drama: 18,
  family: 10751,
  fantasy: 14,
  history: 36,
  horror: 27,
  music: 10402,
  mystery: 9648,
  romance: 10749,
  science_fiction: 878,
  thriller: 53,
  western: 37,
};

// Fallback stub catalog (when TMDB API key is not configured or fails)
const fallbackMovies = [
  {
    id: 508883,
    title: 'Spider-Man: Into the Spider-Verse',
    poster: 'https://image.tmdb.org/t/p/w500/iiZZZe44P0HIOaR04uFun2nQcVk.jpg',
    rating: 8.4,
    overview: 'Teen Miles Morales becomes the Spider-Man of his universe, and must join with five spider-powered individuals from other dimensions to stop a threat for all realities.',
    releaseYear: 2018,
    mediaType: 'movie',
    genres: ['action', 'adventure', 'animation', 'science_fiction'],
  },
  {
    id: 1399,
    title: 'Game of Thrones',
    poster: 'https://image.tmdb.org/t/p/w500/1XS1QmgIk2j25ZOQZ7S0tq54R9Y.jpg',
    rating: 8.4,
    overview: 'Seven noble families fight for control of the mythical land of Westeros. Friction between the houses leads to full-scale war.',
    releaseYear: 2011,
    mediaType: 'tv',
    genres: ['action', 'adventure', 'drama', 'fantasy'],
  },
  {
    id: 60735,
    title: 'The Flash',
    poster: 'https://image.tmdb.org/t/p/w500/r9x6526Zje7eV6fpiiKz6t6wzJ7.jpg',
    rating: 7.8,
    overview: 'After a particle accelerator causes a devastating storm, CSI Investigator Barry Allen is struck by lightning and enters a coma. Months later he awakens with the power of super speed.',
    releaseYear: 2014,
    mediaType: 'tv',
    genres: ['action', 'adventure', 'drama', 'science_fiction'],
  },
  {
    id: 66732,
    title: 'Stranger Things',
    poster: 'https://image.tmdb.org/t/p/w500/49WJfeN0mhmmRLxsf774R6GrjBh.jpg',
    rating: 8.6,
    overview: 'When a young boy vanishes, a small town uncovers a mystery involving secret experiments, terrifying supernatural forces and one strange little girl.',
    releaseYear: 2016,
    mediaType: 'tv',
    genres: ['drama', 'mystery', 'science_fiction'],
  },
  {
    id: 429617,
    title: 'Spider-Man: Far From Home',
    poster: 'https://image.tmdb.org/t/p/w500/4q2AfGevZIS3rlh876zIL5DU2t8.jpg',
    rating: 7.5,
    overview: 'Peter Parker and his friends go on a summer trip to Europe. However, they will hardly be able to rest - Peter will have to agree to help Nick Fury uncover the mystery of several elemental creature attacks.',
    releaseYear: 2019,
    mediaType: 'movie',
    genres: ['action', 'adventure', 'science_fiction'],
  },
  {
    id: 19885,
    title: 'Sherlock',
    poster: 'https://image.tmdb.org/t/p/w500/78n9HrkV7OIYrZ76J4ai45eJ24q.jpg',
    rating: 8.5,
    overview: 'A modern update finds the famous sleuth and his doctor partner solving crime in 21st century London.',
    releaseYear: 2010,
    mediaType: 'tv',
    genres: ['drama', 'mystery'],
  },
  {
    id: 31011,
    title: 'Inception',
    poster: 'https://image.tmdb.org/t/p/w500/o01e01211TdaN5W4nSjJ29q344b.jpg',
    rating: 8.4,
    overview: 'Cobb, a skilled thief who steals valuable secrets from deep within the subconscious during the dream state, is given a chance at redemption: plant an idea into a targets mind.',
    releaseYear: 2010,
    mediaType: 'movie',
    genres: ['action', 'adventure', 'science_fiction', 'mystery', 'thriller'],
  },
  {
    id: 118340,
    title: 'Guardians of the Galaxy',
    poster: 'https://image.tmdb.org/t/p/w500/r7vmZjLuQvXmZnmff7eG8m2iXzC.jpg',
    rating: 7.9,
    overview: 'Light years from Earth, 26 years after being abducted, Peter Quill finds himself the prime target of a manhunt after stealing an orb coveted by Ronan the Accuser.',
    releaseYear: 2014,
    mediaType: 'movie',
    genres: ['action', 'adventure', 'science_fiction'],
  },
  {
    id: 271110,
    title: 'Captain America: Civil War',
    poster: 'https://image.tmdb.org/t/p/w500/rAGiXaU43NIb744RflQ65144NUI.jpg',
    rating: 7.4,
    overview: 'Following the events of Age of Ultron, the collective governments of the world pass an act designed to regulate all superhuman activity. This polarizes the Avengers into two factions.',
    releaseYear: 2016,
    mediaType: 'movie',
    genres: ['action', 'adventure', 'science_fiction'],
  },
  {
    id: 278,
    title: 'The Shawshank Redemption',
    poster: 'https://image.tmdb.org/t/p/w500/9cqN6GOU1HG87rtZ2vwcU1n5Rwq.jpg',
    rating: 8.7,
    overview: 'Imprisoned in the 1940s for the double murder of his wife and her lover, upstanding banker Andy Dufresne begins a new life at the Shawshank prison, where he puts his accounting skills to work for an amoral warden.',
    releaseYear: 1994,
    mediaType: 'movie',
    genres: ['drama', 'crime'],
  },
  {
    id: 13,
    title: 'Forrest Gump',
    poster: 'https://image.tmdb.org/t/p/w500/arw2tUvIQxyh6goq0iV6stwZzuz.jpg',
    rating: 8.5,
    overview: 'A man with a low IQ has accomplished great things in his life and been present during significant historical events—each case far exceeding what anyone imagined he could do.',
    releaseYear: 1994,
    mediaType: 'movie',
    genres: ['comedy', 'drama', 'romance'],
  },
];

// @desc    Discover movies based on genres, mood, language
// @route   POST /api/movies/discover
// @access  Private
const discoverMovies = async (req, res, next) => {
  try {
    const { genres = [], mood = 'feel-good', language = 'en' } = req.body;
    const apiKey = process.env.TMDB_API_KEY;

    // Check if API Key is configured
    if (!apiKey || apiKey === 'your_tmdb_api_key_here' || apiKey === 'your_tmdb_key_here') {
      console.log('⚠️ TMDB API Key not configured. Using fallback catalog.');
      return filterFallbackCatalog(res, genres, mood);
    }

    // Map genres labels to IDs
    const genreIds = genres.map((g) => GENRES[g]).filter(Boolean).join(',');

    // Map mood to TMDB discover parameters
    let sort_by = 'popularity.desc';
    let vote_average_gte = 0;

    if (mood === 'classic') {
      sort_by = 'vote_average.desc';
      vote_average_gte = 7.5;
    } else if (mood === 'intense') {
      vote_average_gte = 6.5;
    } else if (mood === 'mind-bending') {
      vote_average_gte = 7.0;
    }

    // Call TMDB Discover API
    try {
      const response = await axios.get('https://api.themoviedb.org/3/discover/movie', {
        params: {
          api_key: apiKey,
          with_genres: genreIds || undefined,
          sort_by,
          'vote_average.gte': vote_average_gte || undefined,
          with_original_language: language === 'all' ? undefined : language,
          page: 1,
        },
        timeout: 10000,
      });

      const results = response.data?.results || [];

      const movies = results.map((movie) => ({
        id: movie.id,
        title: movie.title || movie.name,
        poster: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : 'https://placehold.co/500x750/1a1a2e/ffffff?text=No+Poster',
        rating: Math.round((movie.vote_average || 0) * 10) / 10,
        overview: movie.overview || 'No overview available.',
        releaseYear: movie.release_date ? new Date(movie.release_date).getFullYear() : 'Unknown',
        mediaType: 'movie',
      })).slice(0, 15);

      return res.json({ movies, source: 'tmdb' });
    } catch (apiError) {
      console.error('❌ TMDB API request failed:', apiError.message);
      console.log('Falling back to local catalog.');
      return filterFallbackCatalog(res, genres, mood);
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get watch providers for a movie/show
// @route   GET /api/movies/providers/:id
// @access  Private
const getWatchProviders = async (req, res, next) => {
  try {
    const { id } = req.params;
    const apiKey = process.env.TMDB_API_KEY;

    if (!apiKey || apiKey === 'your_tmdb_api_key_here' || apiKey === 'your_tmdb_key_here') {
      // Mock providers for fallback
      return res.json({
        providers: [
          { provider_name: 'Netflix', logo: 'https://image.tmdb.org/t/p/original/t2zUg47n3ccWCzi4jvx1ttKh14o.jpg' },
          { provider_name: 'Prime Video', logo: 'https://image.tmdb.org/t/p/original/emZ1gu25ySzo79Pv4Z57H6HQcM.jpg' },
          { provider_name: 'Disney+', logo: 'https://image.tmdb.org/t/p/original/peURlLhxptfvpb4ClT4kFOxHQ15.jpg' },
        ],
      });
    }

    try {
      const response = await axios.get(`https://api.themoviedb.org/3/movie/${id}/watch/providers`, {
        params: { api_key: apiKey },
      });

      const results = response.data?.results || {};
      // Get providers in US (default) or IN or first available country
      const countryCode = 'IN'; // India, or fallback
      const countryProviders = results[countryCode] || results['US'] || Object.values(results)[0] || {};
      const flatrate = countryProviders.flatrate || [];
      const buy = countryProviders.buy || [];
      const rent = countryProviders.rent || [];

      // Combine and filter unique provider objects
      const providersMap = {};
      [...flatrate, ...buy, ...rent].forEach((prov) => {
        providersMap[prov.provider_id] = {
          provider_name: prov.provider_name,
          logo: prov.logo_path ? `https://image.tmdb.org/t/p/original${prov.logo_path}` : null,
        };
      });

      return res.json({
        providers: Object.values(providersMap),
      });
    } catch (apiError) {
      console.error('❌ TMDB Providers API failed:', apiError.message);
      return res.json({
        providers: [
          { provider_name: 'Netflix', logo: 'https://image.tmdb.org/t/p/original/t2zUg47n3ccWCzi4jvx1ttKh14o.jpg' },
          { provider_name: 'Prime Video', logo: 'https://image.tmdb.org/t/p/original/emZ1gu25ySzo79Pv4Z57H6HQcM.jpg' },
        ],
      });
    }
  } catch (error) {
    next(error);
  }
};

// Helper function to filter the local fallback movie database
const filterFallbackCatalog = (res, genres = [], mood = 'feel-good') => {
  let list = [...fallbackMovies];

  // Filter by genres if specified
  if (genres.length > 0) {
    list = list.filter((m) =>
      m.genres.some((g) => genres.includes(g))
    );
  }

  // If no match, reset to all
  if (list.length === 0) list = [...fallbackMovies];

  // Return formatted
  return res.json({
    movies: list.map(({ id, title, poster, rating, overview, releaseYear, mediaType }) => ({
      id,
      title,
      poster,
      rating,
      overview,
      releaseYear,
      mediaType,
    })),
    source: 'fallback',
  });
};

module.exports = { discoverMovies, getWatchProviders };
