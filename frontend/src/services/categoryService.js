import api from './api';

export const categoryService = {
  list: async () => api.get('/categories'),
  create: async (payload) => api.post('/categories', payload),
  delete: async (categoryId) => api.delete(`/categories/${categoryId}`)
};

export default categoryService;

