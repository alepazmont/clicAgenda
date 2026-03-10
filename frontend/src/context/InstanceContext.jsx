import { createContext, useContext, useState, useCallback, useEffect } from 'react';

const STORAGE_KEY = 'clicagenda_instance_superadmin';
// localStorage para que la sesion de instancia se comparta entre pestañas y no se pierda al cambiar de tab
const storage = typeof localStorage !== 'undefined' ? localStorage : typeof sessionStorage !== 'undefined' ? sessionStorage : { getItem: () => null, setItem: () => {}, removeItem: () => {} };

const InstanceContext = createContext({ slug: null, token: null, name: null, setInstance: () => {}, clearInstance: () => {} });

export function InstanceProvider({ children }) {
  const [instance, setInstanceState] = useState(() => {
    try {
      const raw = storage.getItem(STORAGE_KEY);
      if (!raw) return { slug: null, token: null, name: null };
      const data = JSON.parse(raw);
      return { slug: data.slug || null, token: data.instanceToken || data.token || null, name: data.name || null };
    } catch (_) { return { slug: null, token: null, name: null }; }
  });

  useEffect(() => {
    const sync = (e) => {
      try {
        const raw = e && e.newValue != null ? e.newValue : storage.getItem(STORAGE_KEY);
        if (!raw) return;
        const data = JSON.parse(raw);
        setInstanceState({ slug: data.slug || null, token: data.instanceToken || data.token || null, name: data.name || null });
      } catch (_) {}
    };
    sync();
    window.addEventListener('storage', (e) => { if (e.key === STORAGE_KEY) sync(e); });
    return () => window.removeEventListener('storage', sync);
  }, []);

  const setInstance = useCallback((data) => {
    const next = { slug: data.slug || null, token: data.instanceToken || data.token || null, name: data.name || null };
    setInstanceState(next);
    try {
      const raw = storage.getItem(STORAGE_KEY);
      const prev = raw ? JSON.parse(raw) : {};
      storage.setItem(STORAGE_KEY, JSON.stringify({ ...prev, ...data, instanceToken: next.token, at: Date.now() }));
    } catch (_) {}
  }, []);

  const clearInstance = useCallback(() => {
    setInstanceState({ slug: null, token: null, name: null });
    try { storage.removeItem(STORAGE_KEY); } catch (_) {}
  }, []);

  return (
    <InstanceContext.Provider value={{ ...instance, setInstance, clearInstance }}>
      {children}
    </InstanceContext.Provider>
  );
}

export function useInstance() {
  return useContext(InstanceContext);
}
