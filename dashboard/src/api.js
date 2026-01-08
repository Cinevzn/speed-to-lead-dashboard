import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://solveenergy.marketingbyoptimize.com';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getOverallStats = () => api.get('/api/reports/overall');
export const getSetters = () => api.get('/api/reports/setters');
export const getSetterById = (id) => api.get(`/api/reports/setters/${id}`);
export const getLeads = (filters) => api.get('/api/reports/leads', { params: filters });
export const getAverageStats = () => api.get('/api/stats/average');
export const getPercentiles = () => api.get('/api/stats/percentiles');
export const getTrends = (period) => api.get('/api/stats/trends', { params: { period } });
export const getStatsBySetter = () => api.get('/api/stats/by-setter');

export default api;

