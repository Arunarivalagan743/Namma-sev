import api from './api';

export const complaintService = {
  // Create new complaint
  create: async (data) => {
    const response = await api.post('/complaints', data);
    return response.data;
  },

  // Get user's complaints
  getMyComplaints: async (params = {}) => {
    const response = await api.get('/complaints/my-complaints', { params });
    return response.data;
  },

  // Get single complaint
  getById: async (id) => {
    const response = await api.get(`/complaints/${id}`);
    return response.data;
  },

  // Get complaint categories
  getCategories: () => [
    'Road & Infrastructure',
    'Water Supply',
    'Electricity',
    'Sanitation',
    'Street Lights',
    'Drainage',
    'Public Health',
    'Encroachment',
    'Noise Pollution',
    'Other'
  ]
};

export default complaintService;
