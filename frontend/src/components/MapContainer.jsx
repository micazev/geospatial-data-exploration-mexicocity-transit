import React, { useEffect, useState, useMemo } from 'react';
import { MapContainer as LeafletMapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import L from 'leaflet';
import { routeApi, stopApi, heatmapApi } from '../services/api';
import { useMapStore } from '../context/mapStore';
import RouteDetails from './RouteDetails';
import StopDetails from './StopDetails';

const DEFAULT_CENTER = [19.4326, -99.1332]; // Mexico City
const DEFAULT_ZOOM = 11;

function MapContent() {
  const [routeGeoJSON, setRouteGeoJSON] = useState(null);
  const [stopGeoJSON, setStopGeoJSON] = useState(null);
  const [heatmapData, setHeatmapData] = useState(null);
  const [loading, setLoading] = useState(false);

  const mapData = useMapStore((state) => state.mapData);
  const filters = useMapStore((state) => state.filters);
  const selectedRoute = useMapStore((state) => state.selectedRoute);
  const selectedStop = useMapStore((state) => state.selectedStop);
  const setSelectedRoute = useMapStore((state) => state.setSelectedRoute);
  const setSelectedStop = useMapStore((state) => state.setSelectedStop);

  const center = mapData?.center
    ? [mapData.center.latitude, mapData.center.longitude]
    : DEFAULT_CENTER;
  const zoom = mapData?.zoom || DEFAULT_ZOOM;

  // Fetch routes when filters change
  useEffect(() => {
    const fetchRoutes = async () => {
      try {
        setLoading(true);
        const params = {};
        if (filters.modes && filters.modes.length > 0) {
          params.mode = filters.modes[0]; // API expects single mode
        }
        if (filters.district) {
          params.district = filters.district;
        }

        const response = await routeApi.getAllRoutes(params);

        // Convert routes to GeoJSON features
        const features = response.data.routes.map((route) => ({
          type: 'Feature',
          properties: {
            id: route.route_id,
            name: route.route_long_name || route.route_short_name,
            type: 'route',
            color: `#${route.route_color || 'CCCCCC'}`,
            mode: route.mode,
          },
          geometry: {
            type: 'LineString',
            coordinates: [], // Will be populated from shape data if available
          },
        }));

        setRouteGeoJSON({
          type: 'FeatureCollection',
          features,
        });
      } catch (error) {
        console.error('Failed to fetch routes:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRoutes();
  }, [filters.modes, filters.district]);

  // Fetch stops when filters change
  useEffect(() => {
    const fetchStops = async () => {
      try {
        const params = {};
        if (filters.modes && filters.modes.length > 0) {
          params.mode = filters.modes[0];
        }
        if (filters.district) {
          params.district = filters.district;
        }

        const response = await stopApi.getAllStops(params);

        // Convert stops to GeoJSON
        const features = response.data.stops.map((stop) => ({
          type: 'Feature',
          properties: {
            id: stop.stop_id,
            name: stop.stop_name,
            type: 'stop',
            wheelchairAccessible: stop.wheelchair_boarding === 1,
          },
          geometry: {
            type: 'Point',
            coordinates: [stop.stop_lon, stop.stop_lat],
          },
        }));

        setStopGeoJSON({
          type: 'FeatureCollection',
          features,
        });
      } catch (error) {
        console.error('Failed to fetch stops:', error);
      }
    };

    fetchStops();
  }, [filters.modes, filters.district]);

  // Fetch heatmap data
  useEffect(() => {
    const fetchHeatmap = async () => {
      try {
        const heatmapType = 'stops'; // Could be 'routes' or 'stops'
        const params = {};
        if (filters.modes && filters.modes.length > 0) {
          params.mode = filters.modes[0];
        }

        const response = await heatmapApi.getHeatmap(heatmapType, params);
        setHeatmapData(response.data);
      } catch (error) {
        console.error('Failed to fetch heatmap:', error);
      }
    };

    fetchHeatmap();
  }, [filters.modes]);

  const onEachRouteFeature = (feature, layer) => {
    layer.bindPopup(`<strong>${feature.properties.name}</strong><br>Mode: ${feature.properties.mode}`);
    layer.on('click', () => {
      setSelectedRoute(feature.properties);
    });
  };

  const onEachStopFeature = (feature, layer) => {
    layer.bindPopup(`<strong>${feature.properties.name}</strong>`);
    layer.on('click', () => {
      setSelectedStop(feature.properties);
    });
  };

  const routeStyle = (feature) => ({
    color: feature.properties.color,
    weight: 2,
    opacity: 0.7,
  });

  const stopPointToLayer = (feature, latlng) => {
    const markerColor = feature.properties.wheelchairAccessible ? '#2ecc71' : '#3498db';
    return L.circleMarker(latlng, {
      radius: 5,
      fillColor: markerColor,
      color: '#fff',
      weight: 2,
      opacity: 1,
      fillOpacity: 0.8,
    });
  };

  const routeKey = useMemo(
    () => routeGeoJSON ? JSON.stringify(filters) + '-routes' : null,
    [routeGeoJSON, filters]
  );

  const stopKey = useMemo(
    () => stopGeoJSON ? JSON.stringify(filters) + '-stops' : null,
    [stopGeoJSON, filters]
  );

  return (
    <>
      <LeafletMapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap contributors'
        />

        {routeGeoJSON && (
          <GeoJSON
            key={routeKey}
            data={routeGeoJSON}
            style={routeStyle}
            onEachFeature={onEachRouteFeature}
          />
        )}

        {stopGeoJSON && (
          <GeoJSON
            key={stopKey}
            data={stopGeoJSON}
            pointToLayer={stopPointToLayer}
            onEachFeature={onEachStopFeature}
          />
        )}
      </LeafletMapContainer>

      {selectedRoute && <RouteDetails />}
      {selectedStop && <StopDetails />}
    </>
  );
}

export default MapContent;
