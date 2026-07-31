import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

// Helper to decode JWT token payload safely
const parseJwt = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedRole = localStorage.getItem('role');
    const storedUserId = localStorage.getItem('userId');
    const storedName = localStorage.getItem('name');

    if (storedToken) {
      // Validate JWT expiry
      const decoded = parseJwt(storedToken);
      if (decoded && decoded.exp && decoded.exp * 1000 < Date.now()) {
        console.warn('JWT token expired. Clearing session.');
        logout();
        return;
      }

      setToken(storedToken);
      setUser({
        id: storedUserId || '1',
        role: storedRole || 'TRAINER',
        name: storedName || 'User',
      });
    }
  }, []);

  const login = (authData) => {
    // authData: { token, role, userId, name }
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
