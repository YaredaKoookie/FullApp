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

// Doctor API methods
const doctors = {
  list: (params) => api.get('/admin/doctors', { params }),
  get: (id) => api.get(`/admin/doctors/${id}`),
  create: (formData) => {
    return api.post('/admin/doctors', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  update: (id, data) => {
    const formData = new FormData();
    Object.keys(data).forEach(key => {
      if (data[key] !== undefined && data[key] !== null) {
        formData.append(key, data[key]);
      }
    });
    return api.put(`/admin/doctors/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  toggleStatus: (id, isActive) => api.patch(`/admin/doctors/${id}/status`, { isActive }),
  delete: (id) => api.delete(`/admin/doctors/${id}`),
};

export const adminAPI = {
  auth,
  doctors,
  get: api.get,
  post: api.post,
  put: api.put,
  patch: api.patch,
  delete: api.delete,
}; 