import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import client from '../api/client';

const DebugContext = createContext({ rules: [], log: () => {} });

export function DebugProvider({ children }) {
  const [rules, setRules] = useState([]);
  const [loaded, setLoaded] = useState(false);

  const loadSettings = useCallback(() => {
    client.get('/panel/debug/settings').then((res) => {
      setRules(res.data || []);
      setLoaded(true);
    }).catch(() => setLoaded(true));
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const shouldLog = useCallback((scope, output) => {
    const parts = scope.split('.');
    const group = parts[0];
    for (const r of rules) {
      const en = output === 'console' ? r.console_enabled : r.file_enabled;
      if (!en) continue;
      if (r.scope_key === 'all') return true;
      if (r.scope_type === 'group' && r.scope_key === group) return true;
      if (r.scope_type === 'feature' && r.scope_key === scope) return true;
    }
    return false;
  }, [rules]);

  const log = useCallback((scope, message, level = 'info', meta = {}) => {
    if (shouldLog(scope, 'console')) {
      const prefix = `[debug ${scope}]`;
      const fn = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
      fn(prefix, message, Object.keys(meta).length ? meta : '');
    }
    client.post('/panel/debug/log', { scope, message, level, meta }).catch(() => {});
  }, [shouldLog]);

  const refreshSettings = useCallback(() => {
    loadSettings();
  }, [loadSettings]);

  return (
    <DebugContext.Provider value={{ rules, log, refreshSettings, loaded }}>
      {children}
    </DebugContext.Provider>
  );
}

export function useDebugLog() {
  const ctx = useContext(DebugContext);
  return ctx.log ? ctx : { log: () => {} };
}

export function useDebugRefresh() {
  const ctx = useContext(DebugContext);
  return ctx.refreshSettings || (() => {});
}
