import axios from 'axios';

// 基础配置
const apiClient = axios.create({
  baseURL: 'http://127.0.0.1:8000/api', // 指向你的 FastAPI
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器：自动带上 Token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 响应拦截器：处理 401 token 过期
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;