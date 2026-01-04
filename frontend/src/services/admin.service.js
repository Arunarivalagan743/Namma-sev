import api from './api';

export const adminService = {
  // Dashboard stats
  getDashboardStats: async () => {
    const response = await api.get('/admin/dashboard');
    return response.data;
  },

  // User management
  getAllUsers: async (params = {}) => {
    const response = await api.get('/admin/users', { params });
    return response.data;
  },

  getPendingUsers: async () => {
    const response = await api.get('/admin/users/pending');
    return response.data;
  },

  approveUser: async (userId) => {
    const response = await api.put(`/admin/users/${userId}/approve`);
    return response.data;
  },

  rejectUser: async (userId, reason) => {
    const response = await api.put(`/admin/users/${userId}/reject`, { reason });
    return response.data;
  },

  // Complaint management
  getAllComplaints: async (params = {}) => {
    const response = await api.get('/admin/complaints', { params });
    return response.data;
  },

  updateComplaintStatus: async (complaintId, status, remarks) => {
    const response = await api.put(`/admin/complaints/${complaintId}/status`, { status, remarks });
    return response.data;
  },

  // Toggle complaint public visibility
  toggleComplaintVisibility: async (complaintId, isPublic) => {
    const response = await api.patch(`/admin/complaints/${complaintId}/visibility`, { isPublic });
    return response.data;
  },

  // Analytics
  getComplaintAnalytics: async () => {
    const response = await api.get('/admin/complaints/analytics');
    return response.data;
  }
};

export default adminService;
