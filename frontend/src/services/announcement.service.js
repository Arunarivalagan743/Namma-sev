import api from './api';

export const announcementService = {
  // Get all announcements
  getAll: async (params = {}) => {
    const response = await api.get('/announcements', { params });
    return response.data;
  },

  // Get single announcement
  getById: async (id) => {
    const response = await api.get(`/announcements/${id}`);
    return response.data;
  },

  // Create announcement (admin only)
  create: async (data) => {
    const response = await api.post('/announcements', data);
    return response.data;
  },

  // Update announcement (admin only)
  update: async (id, data) => {
    const response = await api.put(`/announcements/${id}`, data);
    return response.data;
  },

  // Delete announcement (admin only)
  delete: async (id) => {
    const response = await api.delete(`/announcements/${id}`);
    return response.data;
  }
};

export default announcementService;
