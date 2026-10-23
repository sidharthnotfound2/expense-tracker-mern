import { createContext, useContext, useEffect, useState } from 'react';
import { api, getToken, setToken } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // on page load, check whether a saved token is still valid
  useEffect(() => {
    async function checkLogin() {
      if (!getToken()) {
        setLoading(false);
        return;
      }
      try {
        const data = await api.me();
        setUser(data.user);
      } catch (err) {
        setToken(null);
      } finally {
        setLoading(false);
      }
    }
    checkLogin();
  }, []);

  async function login(email, password) {
    const data = await api.login({ email, password });
    setToken(data.token);
    setUser(data.user);
  }

  async function register(name, email, password) {
    const data = await api.register({ name, email, password });
    setToken(data.token);
    setUser(data.user);
  }

  function logout() {
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
