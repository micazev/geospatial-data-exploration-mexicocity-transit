const pool = require('../config/database');

const getHeatmap = async (req, res) => {
  try {
    const { type } = req.params;
    const { mode, district } = req.query;

    if (type !== 'routes' && type !== 'stops') {
      return res.status(400).json({ error: 'Invalid heatmap type. Use "routes" or "stops"' });
    }

    let query;
    const params = [];

    if (type === 'stops') {
      query = `SELECT ST_AsGeoJSON(geometry) as geometry, COUNT(*) as intensity
               FROM stops WHERE 1=1`;

      if (mode) {
        query += ` AND stop_id IN (
          SELECT DISTINCT s.stop_id FROM stops s
          JOIN stop_times st ON s.stop_id = st.stop_id
          JOIN trips t ON st.trip_id = t.trip_id
          JOIN routes r ON t.route_id = r.route_id
          WHERE r.mode = $${params.length + 1})`;
        params.push(mode);
      }

      if (district) {
        query += ` AND district = $${params.length + 1}`;
        params.push(district);
      }

      query += ' GROUP BY geometry';
    } else {
      // routes heatmap
      query = `SELECT ST_AsGeoJSON(geometry) as geometry, COUNT(*) as intensity
               FROM shapes WHERE 1=1`;

      if (mode) {
        query += ` AND route_id IN (SELECT route_id FROM routes WHERE mode = $${params.length + 1})`;
        params.push(mode);
      }

      query += ' GROUP BY geometry';
    }

    const result = await pool.query(query, params);

    // Convert to GeoJSON FeatureCollection
    const features = result.rows.map(row => ({
      type: 'Feature',
      geometry: JSON.parse(row.geometry),
      properties: {
        intensity: parseInt(row.intensity),
      },
    }));

    res.json({
      type: 'FeatureCollection',
      features,
    });
  } catch (error) {
    console.error('Error in getHeatmap:', error);
    res.status(500).json({ error: 'Failed to fetch heatmap data' });
  }
};

module.exports = {
  getHeatmap,
};
