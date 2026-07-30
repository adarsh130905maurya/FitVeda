import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8080/api',
  timeout: 10000,
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.clear();
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export default api;

// Auth endpoints
export const register = (data) => api.post('/auth/register', data);
export const login = (data) => api.post('/auth/login', data);

// Plans (Trainer)
export const createPlan = (data) => api.post('/plans', data);
export const addExercise = (planId, data) => api.post(`/plans/${planId}/exercises`, data);
export const assignClient = (planId, clientId) => api.put(`/plans/${planId}/assign/${clientId}`);
export const getClients = () => api.get('/clients');
export const getMyPlan = () => api.get('/plans/my-plan');

// Progress
export const submitProgress = (data) => api.post('/progress', data);
export const getClientProgress = (clientId) => api.get(`/clients/${clientId}/progress`);
