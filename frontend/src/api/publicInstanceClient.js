/**
 * Cliente para las rutas públicas de la instancia (sin token).
 * Añade X-Instance-Slug cuando existe (p. ej. desde ?slug= en localhost).
 */
import axios from 'axios';

function getSlugFromUrl() {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  return params.get('slug') || null;
}

const client = axios.create({
  baseURL: '/api/instance',
  headers: { 'Content-Type': 'application/json' },
});

client.interceptors.request.use((config) => {
  const slug = getSlugFromUrl();
  if (slug) config.headers['X-Instance-Slug'] = slug;
  return config;
});

export default client;
