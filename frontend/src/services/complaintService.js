import api from './api';

export const complaintService = {
  create: async (payload) => api.post('/complaints', payload),
  predict: async (payload) => api.post('/complaints/predict', payload),
  getSuggestions: async (q, orgId, limit = 5) => api.get('/complaints/suggestions', { params: { q, orgId, limit } }),
  getDatasetRecord: async (recordId) => api.get(`/complaints/dataset-records/${recordId}`),
  getById: async (id) => api.get(`/complaints/${id}`),
  getUserComplaints: async (userId) => api.get(`/complaints/user/${userId}`),
  getOrgComplaints: async (orgId) => api.get(`/complaints/org/${orgId}`),
  getOrgQueue: async (orgId) => api.get(`/complaints/org/${orgId}/queue`),
  updateStatus: async (id, payload) => api.put(`/complaints/${id}/status`, payload),
  resolve: async (id, payload) => api.put(`/complaints/${id}/resolve`, payload || {}),
  acknowledge: async (id) => api.put(`/complaints/${id}/acknowledge`),
  delete: async (id) => api.delete(`/complaints/${id}`)
};

export default complaintService;

