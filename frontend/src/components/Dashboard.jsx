import React, { useEffect, useState } from 'react';
import MapContainer from './MapContainer';
import FilterPanel from './FilterPanel';
import Statistics from './Statistics';
import { mapApi } from '../services/api';
import { useMapStore } from '../context/mapStore';

function Dashboard() {
  const [error, setError] = useState(null);
  const { setMapData, setLoading } = useMapStore();

  useEffect(() => {
    const fetchMapData = async () => {
      try {
        setLoading(true);
        const response = await mapApi.getOverview();
        setMapData(response.data);
        setError(null);
      } catch (err) {
        console.error('Map data fetch error:', err);
        setError('Backend not available. Showing map with default settings.');
      } finally {
        setLoading(false);
      }
    };

    fetchMapData();
  }, [setMapData, setLoading]);

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Mexico City Transit System Dashboard</h1>
        <p>Interactive geospatial analysis of Mexico City's multi-modal transportation network</p>
      </header>

      {error && (
        <div className="error-banner">
          <p>⚠️ {error}</p>
        </div>
      )}

      <div className="dashboard-container">
        <aside className="sidebar">
          <FilterPanel />
          <Statistics />
        </aside>

        <main className="main-content">
          <MapContainer />
        </main>
      </div>
    </div>
  );
}

export default Dashboard;
