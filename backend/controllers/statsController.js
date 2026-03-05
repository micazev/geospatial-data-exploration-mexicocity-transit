const pool = require('../config/database');

const getSystemStats = async (req, res) => {
  try {
    const { mode, district } = req.query;
    let whereClause = 'WHERE 1=1';
    const params = [];

    if (mode) {
      whereClause += ' AND mode = $' + (params.length + 1);
      params.push(mode);
    }

    // Get route counts by mode
    let routesByModeQuery = `SELECT mode, COUNT(*) as count FROM routes ${whereClause} GROUP BY mode`;
    const routesByModeResult = await pool.query(routesByModeQuery, params);

    // Get total routes
    const totalRoutesQuery = `SELECT COUNT(*) as count FROM routes ${whereClause}`;
    const totalRoutesResult = await pool.query(totalRoutesQuery, params);

    // Get total stops
    const totalStopsQuery = `SELECT COUNT(DISTINCT stop_id) as count FROM stops`;
    const totalStopsResult = await pool.query(totalStopsQuery);

    // Get stops by district
    const stopsByDistrictQuery = `SELECT district, COUNT(*) as count FROM stops WHERE district IS NOT NULL GROUP BY district`;
    const stopsByDistrictResult = await pool.query(stopsByDistrictQuery);

    res.json({
      totalRoutes: totalRoutesResult.rows[0].count,
      totalStops: totalStopsResult.rows[0].count,
      routesByMode: routesByModeResult.rows,
      stopsByDistrict: stopsByDistrictResult.rows,
    });
  } catch (error) {
    console.error('Error in getSystemStats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
};

module.exports = {
  getSystemStats,
};
