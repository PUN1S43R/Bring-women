import axios from 'axios';

const API_URL = ''; // Relative URL works since we're using Vite proxy or same origin

const api = axios.create({
  baseURL: API_URL,
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authApi = {
  login: (credentials: any) => api.post('/api/auth/login', credentials),
  register: (userData: any) => api.post('/api/auth/register', userData),
  getMe: () => api.get('/api/auth/me'),
  updateProfile: (data: any) => api.put('/api/auth/profile', data),
  updatePassword: (data: any) => api.put('/api/auth/update-password', data),
  resetPassword: (data: any) => api.post('/api/auth/reset-password', data),
  sendOtp: (data: any) => api.post('/api/auth/send-otp', data),
};

export const categoriesApi = {
  getAll: () => api.get('/api/categories'),
  create: (data: any) => api.post('/api/categories', data),
  update: (id: string, data: any) => api.put(`/api/categories/${id}`, data),
  delete: (id: string) => api.delete(`/api/categories/${id}`),
};

export const productsApi = {
  getAll: (params?: any) => api.get('/api/products', { params }),
  getById: (id: string) => api.get(`/api/products/${id}`),
  create: (data: any) => api.post('/api/products', data),
  update: (id: string, data: any) => api.put(`/api/products/${id}`, data),
  delete: (id: string) => api.delete(`/api/products/${id}`),
};

export const slidersApi = {
  getAll: () => api.get('/api/sliders'),
  create: (data: any) => api.post('/api/sliders', data),
  update: (id: string, data: any) => api.put(`/api/sliders/${id}`, data),
  delete: (id: string) => api.delete(`/api/sliders/${id}`),
};

export const ordersApi = {
  create: (data: any) => api.post('/api/orders', data),
  getMy: () => api.get('/api/orders/my'),
  getAll: () => api.get('/api/orders'),
  getItems: (id: string) => api.get(`/api/orders/${id}/items`),
  updateStatus: (id: string, status: string) => api.put(`/api/orders/${id}/status`, { status }),
};

export const paymentApi = {
  createRazorpayOrder: (payload: any) => api.post('/api/payment/create-order', payload),
  verifyRazorpaySignature: (verificationPayload: any) => api.post('/api/payment/verify', verificationPayload),
};

export const usersApi = {
  getAll: () => api.get('/api/users'),
  updateRole: (id: string, role: string) => api.put(`/api/users/${id}/role`, { role }),
};

export const settingsApi = {
  getAll: () => api.get('/api/settings'),
  update: (key: string, value: string) => api.post('/api/settings', { key, value }),
};

export const wishlistApi = {
  getAll: () => api.get('/api/wishlist'),
  toggle: (productId: string) => api.post('/api/wishlist', { product_id: productId }),
  remove: (productId: string) => api.delete(`/api/wishlist/${productId}`),
};

export const reviewsApi = {
  getByProduct: (productId: string) => api.get(`/api/products/${productId}/reviews`),
  create: (productId: string, data: any) => api.post(`/api/products/${productId}/reviews`, data),
};

export const adminApi = {
  getStats: () => api.get('/api/admin/stats'),
};

export const uploadApi = {
  single: (file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    return api.post('/api/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  multiple: (files: any[]) => {
    const formData = new FormData();
    files.forEach((file) => formData.append('images', file));
    return api.post('/api/upload-multiple', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

export const notificationsApi = {
  getAll: () => api.get('/api/admin/notifications'),
  markAllRead: () => api.put('/api/admin/notifications/mark-read'),
  markRead: (id: string) => api.put(`/api/admin/notifications/${id}/read`),
  delete: (id: string) => api.delete(`/api/admin/notifications/${id}`),
  deleteAll: () => api.delete('/api/admin/notifications'),
};

export default api;
