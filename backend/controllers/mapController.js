const pool = require('../config/database');

const getOverview = async (req, res) => {
  try {
    // Get base map configuration and districts GeoJSON
    const result = await pool.query(
      'SELECT * FROM districts ORDER BY name'
    );

    res.json({
      districts: result.rows,
      center: {
        latitude: 19.4326,
        longitude: -99.1332,
      },
      zoom: 11,
      baseLayers: [
        { name: 'Stamen Terrain', type: 'stamen_terrain' },
        { name: 'CartoDB Positron', type: 'cartodb_positron' },
        { name: 'OpenStreetMap', type: 'openstreetmap' },
      ],
    });
  } catch (error) {
    console.error('Error in getOverview:', error);
    res.status(500).json({ error: 'Failed to fetch overview data' });
  }
};

module.exports = {
  getOverview,
};
