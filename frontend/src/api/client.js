import axios from 'axios';

const client = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('panel_token');
  if (token) config.headers.Authorization = 'Bearer ' + token;
  return config;
});

client.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response && err.response.status === 401) {
      localStorage.removeItem('panel_token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default client;
