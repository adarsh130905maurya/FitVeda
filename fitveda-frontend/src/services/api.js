import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor — attaches JWT if available in localStorage
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handles global 401 unauthorized error
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.clear();
      window.location.href = '/'; // Force re-login on 401
    }
    return Promise.reject(error);
  }
);

export default api;

// ==================== AUTH API ====================
export const register = (data) => api.post('/auth/register', data);
export const login = (data) => api.post('/auth/login', data);

// ==================== TRAINER PLAN & CLIENT API ====================
export const createPlan = (data) => api.post('/plans', data);
export const addExercise = (planId, data) => api.post(`/plans/${planId}/exercises`, data);
export const assignClient = (planId, clientId) => api.put(`/plans/${planId}/assign/${clientId}`);
export const getClients = () => api.get('/clients');
export const getClientProgress = (clientId) => api.get(`/clients/${clientId}/progress`);

// ==================== CLIENT PLAN & PROGRESS API ====================
export const getMyPlan = () => api.get('/plans/my-plan');
export const submitProgress = (data) => api.post('/progress', data);
