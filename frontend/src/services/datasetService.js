import api from './api';

export const datasetService = {
  listRequests: async () => api.get('/datasets'),
  listPending: async () => api.get('/datasets/pending'),
  approve: async (requestId) => api.post('/datasets/approve', { requestId }),
  reject: async (requestId) => api.post('/datasets/reject', { requestId }),
  getMainContent: async (limit = 2000, stats = true) => api.get(`/datasets/main/content?limit=${limit}&stats=${stats}`),
  updateMainContent: async (data) => api.post('/datasets/main/content', data),
  getRequestContent: async (requestId, limit = 2000, stats = true) => api.get(`/datasets/${requestId}/content?limit=${limit}&stats=${stats}`),
  updateRequestContent: async (requestId, data) => api.post(`/datasets/${requestId}/content`, data)
};

export default datasetService;

