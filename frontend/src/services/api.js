import axios from 'axios';

const API_BASE_URL = '/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const mapApi = {
  getOverview: () => api.get('/maps/overview'),
};

export const routeApi = {
  getAllRoutes: (params) => api.get('/routes', { params }),
  getRouteById: (id) => api.get(`/routes/${id}`),
};

export const stopApi = {
  getAllStops: (params) => api.get('/stops', { params }),
  getStopById: (id) => api.get(`/stops/${id}`),
};

export const statsApi = {
  getStatistics: (params) => api.get('/statistics', { params }),
};

export const heatmapApi = {
  getHeatmap: (type, params) => api.get(`/heatmap/${type}`, { params }),
};

export const temporalApi = {
  getTemporalData: (mode, hour) => api.get(`/temporal/${mode}/${hour}`),
};

export default api;
