import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_URL,
});

// 拦截器：自动带 Token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

export const authService = {
  // 登录
  login: async (formData: FormData) => {
    const res = await axios.post(`${API_URL}/auth/token`, formData);
    return res.data;
  },

  // 注册
  register: async (data: any) => {
    const res = await axios.post(`${API_URL}/auth/register`, data);
    return res.data;
  },

  // 获取当前用户信息
  getMe: async () => {
    const res = await api.get('/auth/me');
    return res.data;
  }
};

export const taskService = {
  // 👇👇👇 关键修复点：同时提供 getAll 和 getList 两个别名，防止报错 👇👇👇
  getAll: (page = 1, pageSize = 20) => api.get(`/tasks/?page=${page}&page_size=${pageSize}`),
  
  // 你的 Dashboard.tsx 用的是这个名字：
  getList: (params: any) => api.get('/tasks/', { params }),
  // 创建任务
  create: (name: string) => api.post('/tasks/create', null, { params: { name } }),

  // 删除任务
  delete: (id: string) => api.delete(`/tasks/${id}`), 

  // 上传
  upload: (id: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/tasks/${id}/upload`, formData);
  },

  // 其他操作
  start: (id: string) => api.post(`/tasks/${id}/start`),
  stop: (id: string) => api.post(`/tasks/${id}/stop`),
  getDetail: (id: string) => api.get(`/tasks/${id}/detail`),
  getLogs: (id: string) => api.get(`/tasks/${id}/logs`),
};