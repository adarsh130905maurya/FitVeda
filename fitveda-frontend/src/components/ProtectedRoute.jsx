import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ allowedRole, children }) => {
  const { user, token } = useAuth();

  if (!token) {
    return <Navigate to="/" replace />;
  }

  if (allowedRole && user?.role !== allowedRole) {
    return <Navigate to={user?.role === 'TRAINER' ? '/trainer' : '/client'} replace />;
  }

  return children;
};

export default ProtectedRoute;
