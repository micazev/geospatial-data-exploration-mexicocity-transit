import React, { useEffect, useState } from 'react';
import { stopApi } from '../services/api';
import { useMapStore } from '../context/mapStore';

function StopDetails() {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const selectedStop = useMapStore((state) => state.selectedStop);
  const setSelectedStop = useMapStore((state) => state.setSelectedStop);

  useEffect(() => {
    if (!selectedStop) return;

    const fetchDetails = async () => {
      try {
        setLoading(true);
        const response = await stopApi.getStopById(selectedStop.id);
        setDetails(response.data);
      } catch (error) {
        console.error('Failed to fetch stop details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [selectedStop]);

  if (!selectedStop) return null;

  return (
    <div className="popup-overlay">
      <div className="popup-content">
        <button onClick={() => setSelectedStop(null)} className="close-btn">×</button>

        <h2>{selectedStop.name}</h2>

        {loading ? (
          <p>Loading stop details...</p>
        ) : details ? (
          <>
            <div className="stop-info">
              <p><strong>Stop ID:</strong> {selectedStop.id}</p>
              <p>
                <strong>Wheelchair Accessible:</strong>{' '}
                {selectedStop.wheelchairAccessible ? '✓ Yes' : '✗ No'}
              </p>
            </div>

            <h3>Routes Serving This Stop ({details.routes?.length || 0})</h3>
            {details.routes && details.routes.length > 0 ? (
              <ul className="routes-list">
                {details.routes.map((route) => (
                  <li key={route.route_id}>
                    <span className="mode-badge">{route.mode}</span>
                    <span className="route-name">
                      {route.route_long_name || route.route_short_name}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No routes serving this stop</p>
            )}
          </>
        ) : (
          <p>Failed to load stop details</p>
        )}
      </div>
    </div>
  );
}

export default StopDetails;
