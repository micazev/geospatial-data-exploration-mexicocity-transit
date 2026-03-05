import React, { useEffect, useState } from 'react';
import { statsApi } from '../services/api';
import { useMapStore } from '../context/mapStore';

function Statistics() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const filters = useMapStore((state) => state.filters);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const params = {};
        if (filters.modes && filters.modes.length > 0) {
          params.mode = filters.modes[0];
        }
        if (filters.district) {
          params.district = filters.district;
        }

        const response = await statsApi.getStatistics(params);
        setStats(response.data);
      } catch (error) {
        console.error('Failed to fetch statistics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [filters]);

  if (loading) {
    return <div className="statistics loading">Loading...</div>;
  }

  if (!stats) {
    return <div className="statistics">No data</div>;
  }

  return (
    <div className="statistics">
      <h2>System Statistics</h2>

      <div className="stat-card">
        <h3>{stats.totalRoutes}</h3>
        <p>Total Routes</p>
      </div>

      <div className="stat-card">
        <h3>{stats.totalStops}</h3>
        <p>Total Stops</p>
      </div>

      <div className="stat-section">
        <h4>Routes by Mode</h4>
        {stats.routesByMode && stats.routesByMode.length > 0 ? (
          <ul className="stat-list">
            {stats.routesByMode.map((mode) => (
              <li key={mode.mode}>
                <span>{mode.mode}</span>
                <span className="count">{mode.count}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p>No mode data available</p>
        )}
      </div>

      <div className="stat-section">
        <h4>Stops by District</h4>
        {stats.stopsByDistrict && stats.stopsByDistrict.length > 0 ? (
          <ul className="stat-list">
            {stats.stopsByDistrict.slice(0, 5).map((district) => (
              <li key={district.district}>
                <span>{district.district}</span>
                <span className="count">{district.count}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p>No district data available</p>
        )}
      </div>
    </div>
  );
}

export default Statistics;
