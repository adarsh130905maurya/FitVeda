import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [user, setUser] = useState(() => {
    const role = localStorage.getItem('role');
    const userId = localStorage.getItem('userId');
    const name = localStorage.getItem('name');
    const email = localStorage.getItem('email');
    return role ? { role, userId, name, email } : null;
  });

  const login = (data) => {
    // Expected data: { token, role, userId, name, email }
    localStorage.setItem('token', data.token);
    localStorage.setItem('role', data.role);
    localStorage.setItem('userId', data.userId);
    localStorage.setItem('name', data.name);
    if (data.email) localStorage.setItem('email', data.email);
    
    setToken(data.token);
    setUser({
      role: data.role,
      userId: data.userId,
      name: data.name,
      email: data.email || ''
    });
  };

  const logout = () => {
    localStorage.clear();
    setToken(null);
    setUser(null);
    window.location.href = '/';
  };

  // Decode JWT on mount to check expiration (Task 3.12 placeholder/logic)
  useEffect(() => {
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.exp * 1000 < Date.now()) {
          logout();
        }
      } catch (e) {
        // Not a standard JWT yet (e.g. dev-token), allow it for now
      }
    }
  }, [token]);

  return (
    <AuthContext.Provider value={{ token, user, login, logout }}>
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
