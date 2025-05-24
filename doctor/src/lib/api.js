import axios from 'axios';

// Token management
const TOKEN_KEY = 'accessToken';

const getToken = () => localStorage.getItem(TOKEN_KEY);
const setToken = (token) => localStorage.setItem(TOKEN_KEY, token);
const removeToken = () => localStorage.removeItem(TOKEN_KEY);

// API instance
const api = axios.create({
  baseURL: 'http://localhost:3000',
  withCredentials: true,
});

// Request interceptor
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Don't retry if there's no token or it's already a refresh request
    if (!getToken() || originalRequest.url === '/auth/refresh') {
      return Promise.reject(error);
    }

    // Only attempt refresh once
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const { data } = await api.post('/auth/refresh');
        setToken(data.data.accessToken);
        originalRequest.headers.Authorization = `Bearer ${data.data.accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        removeToken();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Auth API methods
const auth = {
  login: (credentials) => api.post('/auth/login', credentials),
  logout: () => {
    removeToken();
    return api.post('/auth/logout');
  },
  getCurrentUser: () => api.get('/auth/me'),
  requestPasswordReset: (email) => api.post('/auth/password-reset', { email }),
  resetPassword: (data) => api.post('/auth/password-reset/confirm', data),
};

// Appointment API methods
const appointments = {
  getAll: (params) => api.get('/doctors/appointments', { params }),
  getStats: () => api.get('/doctors/appointments/stats'),
  accept: (id) => api.post(`/doctors/appointments/${id}/accept`),
  reject: (id, note) => api.post(`/doctors/appointments/${id}/reject`, { note }),
  reschedule: (id, data) => api.post(`/doctors/appointments/${id}/reschedule`, data),
  cancel: (id, reason) => api.post(`/doctors/appointments/${id}/cancel`, { reason }),
};

// Patient API methods
const patients = {
  getAll: (params) => api.get('/doctors/patients', { params }),
  getDetails: (id) => api.get(`/doctors/patients/${id}`),
  getHistory: (id) => api.get(`/doctors/patients/${id}/history`),
  getMedicalHistory: (id) => api.get(`/doctors/patients/${id}/medical-history`),
  getNotes: (id) => api.get(`/doctors/patients/${id}/notes`),
  addNote: (id, note) => api.post(`/doctors/patients/${id}/notes`, note),
  initiateVideoCall: (id) => api.post(`/doctors/patients/${id}/video-call`)
};

// Schedule API methods
export const scheduleApi = {
  getSchedule: (doctorId) => api.get(`/doctors/${doctorId}/schedule`),
  createSchedule: (doctorId, data) => api.post(`/doctors/${doctorId}/schedule`, data),
  updateSchedule: (doctorId, data) => api.put(`/doctors/${doctorId}/schedule`, data),
  getScheduleAnalytics: (doctorId) => api.get(`/doctors/${doctorId}/schedule/analytics`),
  updateRecurringSchedule: (doctorId, data) => api.put(`/doctors/${doctorId}/schedule/recurring`, data),
  updateBreakSettings: (doctorId, data) => api.put(`/doctors/${doctorId}/schedule/breaks`, data),
  generateSlots: (doctorId, data) => api.post(`/doctors/${doctorId}/schedule/slots/generate`, data),
  getSlots: (doctorId, params) => api.get(`/doctors/${doctorId}/schedule/slots`, { params }),
  deleteSlot: (doctorId, slotId) => api.delete(`/doctors/${doctorId}/schedule/slots/${slotId}`),
  addBlockedSlot: (doctorId, data) => api.post(`/doctors/${doctorId}/schedule/blocked`, data),
  getBlockedSlots: (doctorId) => api.get(`/doctors/${doctorId}/schedule/blocked`),
  removeBlockedSlot: (doctorId, slotId) => api.delete(`/doctors/${doctorId}/schedule/blocked/${slotId}`)
};

// Doctor API methods
const doctor = {
  getCurrentDoctor: () => api.get('/doctors/profile'),
  updateProfile: (data) => api.put('/doctors/profile', data),
  getProfileView: () => api.get('/doctors/profile/view'),
  getProfileViewById: (doctorId) => api.get(`/doctors/profile/view/${doctorId}`),
};

const videoCall = {
  getToken: (channel) => api.get(`/video/token`, { params: { channel } }),
};
const reviews = {
  getReviews: (doctorId, filters) => api.get(`/doctors/${doctorId}/reviews`, { params: filters }),
};
// Admin API client
export const adminAPI = {
  auth,
  appointments,
  patients,
  doctor,
  schedule: scheduleApi,
  get: api.get,
  post: api.post,
  put: api.put,
  patch: api.patch,
  delete: api.delete,
  videoCall,
  reviews
}; 