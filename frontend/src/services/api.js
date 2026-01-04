import axios from 'axios';
import { auth } from '../config/firebase';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use(
  async (config) => {
    const user = auth.currentUser;
    if (user) {
      try {
        const token = await user.getIdToken();
        config.headers.Authorization = `Bearer ${token}`;
      } catch (error) {
        console.error('Error getting token:', error);
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      console.error('Unauthorized request');
    }
    
    // Handle pending approval or rejected user errors
    if (error.response?.status === 403) {
      const errorData = error.response.data;
      if (errorData?.error === 'Pending Approval') {
        // User is pending approval, redirect to pending page
        window.location.href = '/pending-approval';
      } else if (errorData?.message?.includes('rejected')) {
        // User is rejected
        window.location.href = '/account-rejected';
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;
