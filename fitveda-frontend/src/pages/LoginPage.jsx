import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { login as loginApi } from '../services/api';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState('TRAINER'); // TRAINER | CLIENT

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const res = await loginApi({ email, password });
      const authData = res.data || {};

      // Structure: { token, role, userId, name }
      const token = authData.token || 'placeholder-jwt-token';
      const role = authData.role || selectedRole;
      const userId = authData.userId || (role === 'TRAINER' ? 1 : 2);
      const name = authData.name || (role === 'TRAINER' ? 'Trainer User' : 'Client User');

      login({ token, role, userId, name });

      // Navigate according to role
      if (role === 'TRAINER') {
        navigate('/trainer');
      } else {
        navigate('/client');
      }
    } catch (err) {
      console.warn('Login API call error:', err);
      const backendError = err.response?.data?.error;
      setErrorMsg(backendError || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#F8FAFC',
      fontFamily: 'Inter, sans-serif',
      padding: '1.5rem',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '420px',
        backgroundColor: '#fff',
        borderRadius: '16px',
        boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05), 0 8px 10px -6px rgba(0,0,0,0.01)',
        padding: '2.5rem',
        border: '1px solid #E2E8F0',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ color: '#2563EB', fontSize: '2rem', margin: 0, fontWeight: 800 }}>FitVeda</h1>
          <p style={{ color: '#64748B', marginTop: '0.5rem', fontSize: '0.95rem' }}>Welcome back! Log in to your account</p>
        </div>

        {/* Inline Error Alert */}
        {errorMsg && (
          <div style={{
            backgroundColor: '#FEF2F2',
            border: '1px solid #FCA5A5',
            color: '#991B1B',
            padding: '0.75rem 1rem',
            borderRadius: '8px',
            fontSize: '0.875rem',
            marginBottom: '1.5rem',
          }}>
            {errorMsg}
          </div>
        )}

        {/* Role Toggle Selector */}
        <div style={{
          display: 'flex',
          backgroundColor: '#F1F5F9',
          borderRadius: '10px',
          padding: '4px',
          marginBottom: '1.5rem',
        }}>
          <button
            type="button"
            onClick={() => setSelectedRole('TRAINER')}
            style={{
              flex: 1,
              padding: '0.6rem',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '0.875rem',
              cursor: 'pointer',
              transition: 'all 200ms ease',
              backgroundColor: selectedRole === 'TRAINER' ? '#fff' : 'transparent',
              color: selectedRole === 'TRAINER' ? '#2563EB' : '#64748B',
              boxShadow: selectedRole === 'TRAINER' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            }}
          >
            👨‍🏫 Trainer
          </button>
          <button
            type="button"
            onClick={() => setSelectedRole('CLIENT')}
            style={{
              flex: 1,
              padding: '0.6rem',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '0.875rem',
              cursor: 'pointer',
              transition: 'all 200ms ease',
              backgroundColor: selectedRole === 'CLIENT' ? '#fff' : 'transparent',
              color: selectedRole === 'CLIENT' ? '#2563EB' : '#64748B',
              boxShadow: selectedRole === 'CLIENT' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            }}
          >
            🏋️ Client
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#334155', marginBottom: '0.4rem' }}>
              Email Address
            </label>
            <input
              type="email"
              required
              placeholder="e.g. user@fitveda.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #CBD5E1',
                borderRadius: '8px',
                fontSize: '0.95rem',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#334155', marginBottom: '0.4rem' }}>
              Password
            </label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #CBD5E1',
                borderRadius: '8px',
                fontSize: '0.95rem',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '0.85rem',
              backgroundColor: '#2563EB',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              marginTop: '0.5rem',
              transition: 'background-color 200ms ease',
            }}
          >
            {loading ? 'Logging in...' : `Log In as ${selectedRole}`}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.75rem', fontSize: '0.875rem', color: '#64748B' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: '#2563EB', fontWeight: 600, textDecoration: 'none' }}>
            Register here
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
