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

// Helper to get active user ID or fallback for Phase 2 dev profile
const getActiveUserId = (fallbackId = 1) => {
  return localStorage.getItem('userId') || fallbackId;
};

// ==================== AUTH API ====================
export const register = (data) => api.post('/auth/register', data);
export const login = (data) => api.post('/auth/login', data);

// ==================== TRAINER PLAN & CLIENT API ====================
export const createPlan = (data, trainerId = getActiveUserId(1)) =>
  api.post('/plans', data, { params: { trainerId } });

export const addExercise = (planId, data, trainerId = getActiveUserId(1)) =>
  api.post(`/plans/${planId}/exercises`, data, { params: { trainerId } });

export const assignClient = (planId, clientId, trainerId = getActiveUserId(1)) =>
  api.put(`/plans/${planId}/assign/${clientId}`, null, { params: { trainerId } });

export const getClients = (trainerId = getActiveUserId(1)) =>
  api.get('/clients', { params: { trainerId } });

export const getClientProgress = (clientId, trainerId = getActiveUserId(1)) =>
  api.get(`/clients/${clientId}/progress`, { params: { trainerId } });

// ==================== CLIENT PLAN & PROGRESS API ====================
export const getMyPlan = (clientId = getActiveUserId(2)) =>
  api.get('/plans/my-plan', { params: { clientId } });

export const submitProgress = (data, clientId = getActiveUserId(2)) =>
  api.post('/progress', data, { params: { clientId } });
