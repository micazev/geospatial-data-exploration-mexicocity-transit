import React, { useEffect, useState } from 'react';
import { routeApi } from '../services/api';
import { useMapStore } from '../context/mapStore';

function RouteDetails() {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const selectedRoute = useMapStore((state) => state.selectedRoute);
  const setSelectedRoute = useMapStore((state) => state.setSelectedRoute);

  useEffect(() => {
    if (!selectedRoute) return;

    const fetchDetails = async () => {
      try {
        setLoading(true);
        const response = await routeApi.getRouteById(selectedRoute.id);
        setDetails(response.data);
      } catch (error) {
        console.error('Failed to fetch route details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [selectedRoute]);

  if (!selectedRoute) return null;

  return (
    <div className="popup-overlay">
      <div className="popup-content">
        <button onClick={() => setSelectedRoute(null)} className="close-btn">×</button>

        <h2>{selectedRoute.name}</h2>

        {loading ? (
          <p>Loading route details...</p>
        ) : details ? (
          <>
            <div className="route-info">
              <p><strong>Mode:</strong> {selectedRoute.mode}</p>
              <p><strong>Route ID:</strong> {selectedRoute.id}</p>
              {selectedRoute.color && (
                <p>
                  <strong>Color:</strong>
                  <span
                    className="color-box"
                    style={{ backgroundColor: selectedRoute.color }}
                  />
                </p>
              )}
            </div>

            <h3>Stops ({details.stops?.length || 0})</h3>
            {details.stops && details.stops.length > 0 ? (
              <ul className="stops-list">
                {details.stops.slice(0, 10).map((stop) => (
                  <li key={stop.stop_id}>
                    <span className="stop-name">{stop.stop_name}</span>
                    <span className="stop-id">{stop.stop_id}</span>
                  </li>
                ))}
                {details.stops.length > 10 && (
                  <li>... and {details.stops.length - 10} more stops</li>
                )}
              </ul>
            ) : (
              <p>No stops available</p>
            )}
          </>
        ) : (
          <p>Failed to load route details</p>
        )}
      </div>
    </div>
  );
}

export default RouteDetails;
