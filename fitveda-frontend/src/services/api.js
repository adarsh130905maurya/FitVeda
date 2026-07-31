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
    if (error.response?.status === 429) {
      const event = new CustomEvent('fitveda-toast', {
        detail: { message: 'Too many requests — please slow down.', type: 'warning' }
      });
      window.dispatchEvent(event);
    }
    return Promise.reject(error);
  }
);

export default api;

// Auth endpoints
export const register = (data) => api.post('/auth/register', data);
export const login = (data) => api.post('/auth/login', data);

// Plans (Trainer)
export const createPlan = (data, trainerId) => api.post('/plans', data, { params: { trainerId } });
export const addExercise = (planId, data, trainerId) => api.post(`/plans/${planId}/exercises`, data, { params: { trainerId } });
export const assignClient = (planId, clientId, trainerId) => api.put(`/plans/${planId}/assign/${clientId}`, null, { params: { trainerId } });
export const getClients = (trainerId) => api.get('/clients', { params: { trainerId } });
export const getMyPlan = (clientId) => api.get('/plans/my-plan', { params: { clientId } });

// Progress
export const submitProgress = (data, clientId) => api.post('/progress', data, { params: { clientId } });
export const getClientProgress = (clientId, trainerId) => api.get(`/clients/${clientId}/progress`, { params: { trainerId } });

