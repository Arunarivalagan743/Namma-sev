import api from './api';

export const complaintService = {
  // Create new complaint with images and priority
  create: async (data) => {
    const response = await api.post('/complaints', data);
    return response.data;
  },

  // Get user's complaints with stats
  getMyComplaints: async (params = {}) => {
    const response = await api.get('/complaints/my-complaints', { params });
    return response.data;
  },

  // Get single complaint with timeline
  getById: async (id) => {
    const response = await api.get(`/complaints/${id}`);
    return response.data;
  },

  // Track complaint by tracking ID (public - no auth)
  track: async (trackingId) => {
    const response = await api.get(`/complaints/track/${trackingId}`);
    return response.data;
  },

  // Submit feedback for resolved complaint
  submitFeedback: async (id, data) => {
    const response = await api.post(`/complaints/${id}/feedback`, data);
    return response.data;
  },

  // Get wards list
  getWards: async () => {
    const response = await api.get('/complaints/wards');
    return response.data;
  },

  // Get complaint categories and priorities
  getCategoriesAndPriorities: async () => {
    try {
      const response = await api.get('/complaints/categories');
      return response.data;
    } catch (error) {
      // Fallback to default
      return {
        categories: complaintService.getCategories(),
        priorities: complaintService.getPriorities()
      };
    }
  },

  // Get complaint categories (static fallback)
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
  ],

  // Get priority levels
  getPriorities: () => [
    { value: 'low', label: 'Low', color: 'gov-blue', description: 'Minor issue, can be addressed later' },
    { value: 'normal', label: 'Normal', color: 'gov-blue', description: 'Standard priority' },
    { value: 'high', label: 'High', color: 'gov-red', description: 'Needs attention soon' },
    { value: 'urgent', label: 'Urgent', color: 'gov-red', description: 'Immediate attention required' }
  ],

  // Get status config - using website colors (gov-blue and gov-red)
  getStatusConfig: () => ({
    pending: { 
      label: 'Pending', 
      color: 'gov-blue', 
      bgColor: 'bg-gov-blue/10', 
      textColor: 'text-gov-blue',
      description: 'Awaiting review'
    },
    in_progress: { 
      label: 'In Progress', 
      color: 'gov-blue', 
      bgColor: 'bg-gov-blue/20', 
      textColor: 'text-gov-blue',
      description: 'Being worked on'
    },
    resolved: { 
      label: 'Resolved', 
      color: 'gov-blue', 
      bgColor: 'bg-gov-blue/10', 
      textColor: 'text-gov-blue',
      description: 'Issue resolved'
    },
    rejected: { 
      label: 'Rejected', 
      color: 'gov-red', 
      bgColor: 'bg-gov-red/10', 
      textColor: 'text-gov-red',
      description: 'Could not be processed'
    }
  }),

  // Get category icons - removed emojis, components will use Feather icons
  getCategoryIcons: () => ({
    'Road & Infrastructure': 'road',
    'Water Supply': 'water',
    'Electricity': 'electricity',
    'Sanitation': 'sanitation',
    'Street Lights': 'streetlight',
    'Drainage': 'drainage',
    'Public Health': 'health',
    'Encroachment': 'encroachment',
    'Noise Pollution': 'noise',
    'Other': 'other'
  })
};

export default complaintService;
