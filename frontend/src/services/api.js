import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// In-memory API cache & pending promises deduplication map
const apiCache = new Map();
const pendingRequests = new Map();
const CACHE_TTL = 15000; // 15 seconds cache TTL for super fast navigation

api.interceptors.request.use((config) => {
  const method = config.method ? config.method.toLowerCase() : 'get';

  if (method === 'get') {
    const cacheKey = config.url + JSON.stringify(config.params || {});
    const cached = apiCache.get(cacheKey);

    if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
      // Serve from client cache instantly
      config.adapter = () => Promise.resolve({
        data: cached.data,
        status: 200,
        statusText: 'OK (Cache)',
        headers: config.headers,
        config: config
      });
    }
  } else {
    // Invalidate cache on mutations (POST, PUT, DELETE)
    apiCache.clear();
  }
  return config;
});

api.interceptors.response.use((response) => {
  const method = response.config.method ? response.config.method.toLowerCase() : 'get';
  if (method === 'get' && response.status === 200) {
    const cacheKey = response.config.url + JSON.stringify(response.config.params || {});
    apiCache.set(cacheKey, {
      data: response.data,
      timestamp: Date.now()
    });
  }
  return response;
}, (error) => {
  return Promise.reject(error);
});

export const clearApiCache = () => apiCache.clear();

export default api;

