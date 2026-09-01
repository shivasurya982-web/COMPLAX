import { api } from './api';

export const complaintService = {
  list: async () => api.get('/complaints'),
  create: async (payload) => api.post('/complaints', payload),
};
