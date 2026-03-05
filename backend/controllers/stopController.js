const pool = require('../config/database');

const getAllStops = async (req, res) => {
  try {
    const { mode, district, limit = 1000 } = req.query;
    let query = `SELECT DISTINCT s.* FROM stops s
                 LEFT JOIN stop_times st ON s.stop_id = st.stop_id
                 LEFT JOIN trips t ON st.trip_id = t.trip_id
                 WHERE 1=1`;
    const params = [];

    if (mode) {
      query += ' AND t.route_id IN (SELECT route_id FROM routes WHERE mode = $' + (params.length + 1) + ')';
      params.push(mode);
    }

    if (district) {
      query += ' AND s.district = $' + (params.length + 1);
      params.push(district);
    }

    query += ' LIMIT $' + (params.length + 1);
    params.push(parseInt(limit));

    const result = await pool.query(query, params);
    res.json({
      count: result.rows.length,
      stops: result.rows,
    });
  } catch (error) {
    console.error('Error in getAllStops:', error);
    res.status(500).json({ error: 'Failed to fetch stops' });
  }
};

const getStopById = async (req, res) => {
  try {
    const { id } = req.params;

    // Get stop details
    const stopResult = await pool.query(
      'SELECT * FROM stops WHERE stop_id = $1',
      [id]
    );

    if (stopResult.rows.length === 0) {
      return res.status(404).json({ error: 'Stop not found' });
    }

    const stop = stopResult.rows[0];

    // Get routes that service this stop
    const routesResult = await pool.query(
      `SELECT DISTINCT r.* FROM routes r
       JOIN trips t ON r.route_id = t.route_id
       JOIN stop_times st ON t.trip_id = st.trip_id
       WHERE st.stop_id = $1`,
      [id]
    );

    res.json({
      stop,
      routes: routesResult.rows,
    });
  } catch (error) {
    console.error('Error in getStopById:', error);
    res.status(500).json({ error: 'Failed to fetch stop details' });
  }
};

module.exports = {
  getAllStops,
  getStopById,
};
