import { api } from './api';

export const authService = {
  login: async (payload) => api.post('/login', payload),
  registerUser: async (payload) => api.post('/register-user', payload),
  registerSecondaryAdmin: async (payload) => api.post('/register-secondary-admin', payload),
};
