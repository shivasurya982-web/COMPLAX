import api from './api';

export const organizationService = {
  list: async () => api.get('/organizations'),
  listApproved: async () => api.get('/organizations/approved'),
  register: async (formData) => api.post('/organizations/register', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  approve: async (organizationId) => api.post('/organizations/approve', { organizationId }),
  reject: async (organizationId) => api.post('/organizations/reject', { organizationId }),
  suspend: async (organizationId) => api.post('/organizations/suspend', { organizationId }),
  activate: async (organizationId) => api.post('/organizations/activate', { organizationId }),
  delete: async (organizationId) => api.delete(`/organizations/${organizationId}`),
  getUsers: async (orgId) => api.get(`/organizations/${orgId}/users`)
};

export default organizationService;

