import { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('gosandy_token');
    const savedUser = localStorage.getItem('gosandy_user');
    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('gosandy_token', data.data.token);
    localStorage.setItem('gosandy_user', JSON.stringify(data.data.user));
    setUser(data.data.user);
    return data.data.user;
  };

  const logout = () => {
    localStorage.removeItem('gosandy_token');
    localStorage.removeItem('gosandy_user');
    setUser(null);
  };

  const isBoss  = () => user?.role === 'BOSS';
  const isAdmin = () => user?.role === 'ADMIN' || user?.role === 'BOSS';
  const isStaff = () => !!user;

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isBoss, isAdmin, isStaff }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
