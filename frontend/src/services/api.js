import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// In-memory API cache & pending promises deduplication map
const apiCache = new Map();
const CACHE_TTL = 15000; // 15 seconds cache TTL for super fast navigation

api.interceptors.request.use((config) => {
  // Attach user context headers for secure backend role and organization verification
  try {
    const savedUser = localStorage.getItem('complax_user');
    if (savedUser) {
      const user = JSON.parse(savedUser);
      if (user.userId) config.headers['X-User-Id'] = user.userId;
      if (user.role) config.headers['X-User-Role'] = user.role;
      if (user.organizationId) config.headers['X-Organization-Id'] = user.organizationId;
    }
  } catch (e) {
    // ignore json parse error
  }

  const method = config.method ? config.method.toLowerCase() : 'get';
  const isExcluded = config.url && (config.url.includes('/content') || config.url.includes('/download')) || config.responseType === 'blob';

  if (method === 'get' && !isExcluded) {
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
    if (!isExcluded) {
      apiCache.clear();
    }
  }
  return config;
});

api.interceptors.response.use((response) => {
  const method = response.config.method ? response.config.method.toLowerCase() : 'get';
  const isExcluded = response.config.url && (response.config.url.includes('/content') || response.config.url.includes('/download')) || response.config.responseType === 'blob';

  if (method === 'get' && response.status === 200 && !isExcluded) {
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
export { api };
export default api;


