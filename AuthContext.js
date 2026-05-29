import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('inv_token');
    const username = localStorage.getItem('inv_username');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser({ token, username });
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    const res = await axios.post('/api/login', { username, password });
    const { token } = res.data;
    localStorage.setItem('inv_token', token);
    localStorage.setItem('inv_username', username);
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setUser({ token, username });
  };

  const register = async (username, password) => {
    const res = await axios.post('/api/register', { username, password });
    const { token } = res.data;
    localStorage.setItem('inv_token', token);
    localStorage.setItem('inv_username', username);
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setUser({ token, username });
  };

  const logout = () => {
    localStorage.removeItem('inv_token');
    localStorage.removeItem('inv_username');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
