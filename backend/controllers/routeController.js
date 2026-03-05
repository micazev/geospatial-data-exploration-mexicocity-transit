const pool = require('../config/database');

const getAllRoutes = async (req, res) => {
  try {
    const { mode, district } = req.query;
    let query = 'SELECT * FROM routes WHERE 1=1';
    const params = [];

    if (mode) {
      query += ' AND mode = $' + (params.length + 1);
      params.push(mode);
    }

    if (district) {
      query += ' AND district = $' + (params.length + 1);
      params.push(district);
    }

    query += ' ORDER BY route_id';

    const result = await pool.query(query, params);
    res.json({
      count: result.rows.length,
      routes: result.rows,
    });
  } catch (error) {
    console.error('Error in getAllRoutes:', error);
    res.status(500).json({ error: 'Failed to fetch routes' });
  }
};

const getRouteById = async (req, res) => {
  try {
    const { id } = req.params;

    // Get route details
    const routeResult = await pool.query(
      'SELECT * FROM routes WHERE route_id = $1',
      [id]
    );

    if (routeResult.rows.length === 0) {
      return res.status(404).json({ error: 'Route not found' });
    }

    const route = routeResult.rows[0];

    // Get route stops
    const stopsResult = await pool.query(
      `SELECT s.* FROM stops s
       JOIN stop_times st ON s.stop_id = st.stop_id
       JOIN trips t ON st.trip_id = t.trip_id
       WHERE t.route_id = $1
       ORDER BY st.stop_sequence`,
      [id]
    );

    // Get route shape
    const shapeResult = await pool.query(
      `SELECT ST_AsGeoJSON(ST_Collect(geometry)) as geom
       FROM shapes WHERE route_id = $1`,
      [id]
    );

    res.json({
      route,
      stops: stopsResult.rows,
      shape: shapeResult.rows[0]?.geom,
    });
  } catch (error) {
    console.error('Error in getRouteById:', error);
    res.status(500).json({ error: 'Failed to fetch route details' });
  }
};

module.exports = {
  getAllRoutes,
  getRouteById,
};
