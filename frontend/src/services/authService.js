import api from './api';

export const authService = {
  login: async (payload) => api.post('/auth/login', payload),
  registerUser: async (payload) => api.post('/auth/user/register', payload),
  registerSecondaryAdmin: async (payload) => api.post('/organizations/register', payload),
  updateProfile: async (payload) => api.post('/auth/profile/update', payload),
  getProfileRequests: async () => api.get('/auth/profile/requests'),
  approveProfileRequest: async (requestId) => api.post('/auth/profile/requests/approve', { requestId }),
  checkForgotEmail: async (email) => api.post('/auth/forgot-password/check-email', { email }),
  verifyForgotHint: async (email, recoveryHint) => api.post('/auth/forgot-password/verify-hint', { email, recoveryHint }),
  resetForgotPassword: async (payload) => api.post('/auth/forgot-password/reset', payload)
};

export default authService;

