import { api } from './api';

export const categoryService = {
  list: async () => api.get('/categories'),
  create: async (payload) => api.post('/categories', payload),
};
