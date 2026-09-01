import { api } from './api';

export const datasetService = {
  listRequests: async () => api.get('/dataset-requests'),
  submitRequest: async (payload) => api.post('/dataset-requests', payload),
};
