const pool = require('../config/database');

const getTemporalData = async (req, res) => {
  try {
    const { mode, hour } = req.params;

    const hourNum = parseInt(hour);
    if (isNaN(hourNum) || hourNum < 0 || hourNum > 23) {
      return res.status(400).json({ error: 'Hour must be between 0 and 23' });
    }

    // Get routes active at this hour
    const routesQuery = `
      SELECT DISTINCT r.* FROM routes r
      JOIN trips t ON r.route_id = t.route_id
      JOIN stop_times st ON t.trip_id = st.trip_id
      WHERE r.mode = $1
      AND EXTRACT(HOUR FROM st.arrival_time::time) = $2
    `;

    const routesResult = await pool.query(routesQuery, [mode, hourNum]);

    // Get stops active at this hour
    const stopsQuery = `
      SELECT DISTINCT s.* FROM stops s
      JOIN stop_times st ON s.stop_id = st.stop_id
      JOIN trips t ON st.trip_id = t.trip_id
      JOIN routes r ON t.route_id = r.route_id
      WHERE r.mode = $1
      AND EXTRACT(HOUR FROM st.arrival_time::time) = $2
    `;

    const stopsResult = await pool.query(stopsQuery, [mode, hourNum]);

    res.json({
      mode,
      hour: hourNum,
      routeCount: routesResult.rows.length,
      stopCount: stopsResult.rows.length,
      routes: routesResult.rows,
      stops: stopsResult.rows,
    });
  } catch (error) {
    console.error('Error in getTemporalData:', error);
    res.status(500).json({ error: 'Failed to fetch temporal data' });
  }
};

module.exports = {
  getTemporalData,
};
