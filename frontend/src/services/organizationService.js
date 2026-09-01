import { api } from './api';

export const organizationService = {
  list: async () => api.get('/organizations'),
  create: async (payload) => api.post('/organizations', payload),
};
