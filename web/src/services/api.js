import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const res = await axios.post(`${API_URL}/auth/refresh`, { token: refreshToken });
          localStorage.setItem('token', res.data.token);
          localStorage.setItem('refreshToken', res.data.refreshToken);
          originalRequest.headers.Authorization = `Bearer ${res.data.token}`;
          return api(originalRequest);
        } catch {
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
        }
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
};

export const messageAPI = {
  send: (data) => api.post('/messages/send', data),
  uploadImage: async (formData) => {
    const token = localStorage.getItem('token');
    return axios.post(`${API_URL}/messages/upload-image`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: `Bearer ${token}`,
      },
    });
  },
  sync: () => api.get('/messages/sync'),
  conversations: () => api.get('/messages/conversations'),
  nearby: () => api.get('/messages/nearby'),
  search: (query) => api.get(`/messages/search?q=${encodeURIComponent(query || '')}`),
};

export const groupAPI = {
  create: (data) => api.post('/groups', data),
  getAll: () => api.get('/groups'),
  joinByCode: (code) => api.post('/groups/join', { code }),
  getMessages: (id) => api.get(`/groups/${id}/messages`),
  addMember: (id, userId) => api.post(`/groups/${id}/members`, { userId }),
};

export const channelAPI = {
  create: (data) => api.post('/channels', data),
  subscribe: (id) => api.post(`/channels/${id}/subscribe`),
  reactToMessage: (id, messageId, type) => api.post(`/channels/${id}/messages/${messageId}/react`, { type }),
  getMessages: (id) => api.get(`/channels/${id}/messages`),
  getAll: () => api.get('/channels'),
};

export default api;