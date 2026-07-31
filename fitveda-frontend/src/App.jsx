import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import TrainerDashboard from './pages/TrainerDashboard';
import ClientDashboard from './pages/ClientDashboard';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/trainer"
            element={
              <ProtectedRoute allowedRole="TRAINER">
                <TrainerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/client"
            element={
              <ProtectedRoute allowedRole="CLIENT">
                <ClientDashboard />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
