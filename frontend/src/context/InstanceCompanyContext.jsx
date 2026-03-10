import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { createTheme } from '@mui/material/styles';
import instanceClient from '../api/instanceClient';

const InstanceCompanyContext = createContext(null);

export function useInstanceCompany() {
  return useContext(InstanceCompanyContext);
}

const defaultTheme = createTheme({
  palette: {
    primary: { main: '#1976d2' },
    secondary: { main: '#f50057' },
    background: { default: '#f5f5f5' },
  },
  typography: { fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif' },
});

function buildThemeFromColors(colors) {
  if (!colors) return null;
  const c = typeof colors === 'string' ? { primary: colors } : colors;
  return createTheme({
    palette: {
      primary: { main: c.primary || '#1976d2' },
      secondary: { main: c.secondary || '#f50057' },
      background: { default: '#f5f5f5' },
    },
    typography: { fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif' },
  });
}

export function InstanceCompanyProvider({ children }) {
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    instanceClient.get('/data/company')
      .then((res) => setCompany(res.data || {}))
      .catch(() => setCompany({}))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const theme = useMemo(() => {
    if (!company || !company.colors) return defaultTheme;
    return buildThemeFromColors(company.colors) || defaultTheme;
  }, [company]);

  const value = useMemo(() => ({
    company,
    loading,
    refresh: load,
    theme,
  }), [company, loading, load, theme]);

  return (
    <InstanceCompanyContext.Provider value={value}>
      {children}
    </InstanceCompanyContext.Provider>
  );
}
