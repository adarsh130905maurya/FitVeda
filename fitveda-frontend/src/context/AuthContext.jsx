import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedRole = localStorage.getItem('role');
    const storedUserId = localStorage.getItem('userId');
    const storedName = localStorage.getItem('name');

    if (storedToken && storedRole && storedUserId) {
      setToken(storedToken);
      setUser({
        id: storedUserId,
        role: storedRole,
        name: storedName || '',
      });
    }
  }, []);

  const login = (authData) => {
    // authData expected: { token, role, userId, name }
    localStorage.setItem('token', authData.token);
    localStorage.setItem('role', authData.role);
    localStorage.setItem('userId', authData.userId);
    if (authData.name) {
      localStorage.setItem('name', authData.name);
    }

    setToken(authData.token);
    setUser({
      id: authData.userId,
      role: authData.role,
      name: authData.name || '',
    });
  };

  const logout = () => {
    localStorage.clear();
    setToken(null);
    setUser(null);
    window.location.href = '/';
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
