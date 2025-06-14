import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Token management
const TOKEN_KEY = "accessToken";

const getToken = () => localStorage.getItem(TOKEN_KEY);
const setToken = (token) => localStorage.setItem(TOKEN_KEY, token);
const removeToken = () => localStorage.removeItem(TOKEN_KEY);

// API instance
const api = axios.create({
  baseURL: BASE_URL,
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
    if (!getToken() || originalRequest.url === "/auth/refresh") {
      return Promise.reject(error);
    }

    // Only attempt refresh once
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const { data } = await api.post("/auth/refresh");
        setToken(data.data.accessToken);
        originalRequest.headers.Authorization = `Bearer ${data.data.accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        removeToken();
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Auth API methods
const auth = {
  login: (credentials) => api.post("/auth/login", credentials),
  logout: () => {
    removeToken();
    return api.post("/auth/logout");
  },
  getCurrentUser: () => api.get("/auth/me"),
  requestPasswordReset: (email) => api.post("/auth/password-reset", { email }),
  resetPassword: (data) => api.post("/auth/password-reset/confirm", data),
};

// Doctor API methods
const doctors = {
  list: (params) => api.get("/admin/doctors", { params }),
  get: (id) => api.get(`/admin/doctors/${id}`),
  create: (formData) => {
    return api.post("/admin/doctors", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },
  update: (id, data) => {
    const formData = new FormData();
    
    // Helper function to handle nested objects and arrays
    const appendFormData = (data, parentKey = '') => {
      if (data && typeof data === 'object' && !(data instanceof File)) {
        Object.keys(data).forEach(key => {
          const value = data[key];
          const fullKey = parentKey ? `${parentKey}[${key}]` : key;
          
          if (value instanceof File) {
            formData.append(fullKey, value);
          } else if (Array.isArray(value) || typeof value === 'object') {
            formData.append(fullKey, JSON.stringify(value));
          } else if (value !== undefined && value !== null) {
            formData.append(fullKey, value);
          }
        });
      } else if (data !== undefined && data !== null) {
        formData.append(parentKey, data);
      }
    };

    appendFormData(data);
    
    return api.put(`/admin/doctors/${id}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },
  toggleStatus: (id, isActive) =>
    api.patch(`/admin/doctors/${id}/status`, { isActive }),
  delete: (id) => api.delete(`/admin/doctors/${id}`),
};

// Appointments API for admin
const appointments = {
  list: () => api.get("/admin/appointments"),
  get: (id) => api.get(`/admin/appointments/${id}`),
};
const banks = {
  get: () => api.get("./admin/banks"),
};

// Add this before the adminAPI export
const payments = {
  list: (params) => api.get("/admin/payments", { params }),
  get: (id) => api.get(`/admin/payments/${id}`),
  getSummary: () => api.get("/admin/payments/summary"),
  export: (params) => api.get("/admin/payments/export", { 
    params,
    responseType: 'blob' // Important for file download
  }),
  refund: (id) => api.post(`/admin/payments/refund/${id}`),
};

// Admin API client
export const adminAPI = {
  auth,
  doctors,
  appointments,
  get: api.get,
  post: api.post,
  put: api.put,
  patch: api.patch,
  delete: api.delete,
  // banks
  banks,
  // User Management
  users: {
    list: (params) => api.get("/admin/users", { params }),
    get: (id) => api.get(`/admin/users/${id}`),
    update: (id, data) => api.put(`/admin/users/${id}`, data),
    toggleStatus: (id, isActive) =>
      api.patch(`/admin/users/${id}/status`, { isActive }),
    delete: (id) => api.delete(`/admin/users/${id}`),
  },
  payments,
  // Add analytics API
  analytics: {
    getDashboard: () => api.get("/admin/analytics"),
    getRecentActivity: () => api.get("/admin/analytics/recent"),
    getTodayStats: () => api.get("/admin/analytics/today"),
  }
};
