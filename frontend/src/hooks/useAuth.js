import { useState } from 'react';

export function useAuth() {
  const [token, setToken] = useState(() => localStorage.getItem('panel_token'));

  const login = (newToken) => {
    localStorage.setItem('panel_token', newToken);
    setToken(newToken);
  };

  const logout = () => {
    localStorage.removeItem('panel_token');
    setToken(null);
  };

  return { token, loading: false, login, logout };
}
