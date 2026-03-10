import axios from 'axios';

const STORAGE_KEY = 'clicagenda_instance_superadmin';
const storage = typeof localStorage !== 'undefined' ? localStorage : typeof sessionStorage !== 'undefined' ? sessionStorage : { getItem: () => null, removeItem: () => {} };

function getStored() {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return { slug: null, token: null };
    const data = JSON.parse(raw);
    return { slug: data.slug || null, token: data.instanceToken || data.token || null };
  } catch (_) { return { slug: null, token: null }; }
}

const client = axios.create({
  baseURL: '/api/instance',
  headers: { 'Content-Type': 'application/json' },
});

client.interceptors.request.use((config) => {
  const { slug, token } = getStored();
  if (slug) config.headers['X-Instance-Slug'] = slug;
  if (token) config.headers.Authorization = 'Bearer ' + token;
  return config;
});

function clearTokenOnly() {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      storage.setItem(STORAGE_KEY, JSON.stringify({ ...data, token: null, instanceToken: null }));
    } else {
      storage.removeItem(STORAGE_KEY);
    }
  } catch (_) {}
}

client.interceptors.response.use(
  (r) => r,
  (err) => {
    const isInstanceNotFound = err.response?.status === 404 && err.response?.data?.error && (err.response.data.error === 'Instancia no encontrada' || String(err.response.data.error).includes('slug'));
    const isUnauthorized = err.response?.status === 401;
    if (isUnauthorized || isInstanceNotFound) {
      clearTokenOnly();
      const loginPath = typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1' ? '/login' : '/app/login';
      if (typeof window !== 'undefined' && !window.location.pathname.endsWith(loginPath)) {
        window.location.href = loginPath;
      }
    }
    return Promise.reject(err);
  }
);

export default client;
