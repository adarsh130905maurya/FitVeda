import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register as registerApi } from '../services/api';

const RegisterPage = () => {
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState('TRAINER'); // TRAINER | CLIENT

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    // Client-side validation
    if (!name.trim()) {
      setErrorMsg('Full Name is required');
      return;
    }

    if (!email.includes('@') || !email.includes('.')) {
      setErrorMsg('Please enter a valid email address');
      return;
    }

    if (password.length < 8) {
      setErrorMsg('Password must be at least 8 characters long');
      return;
    }

    setLoading(true);

    try {
      await registerApi({ name, email, password, role });
      alert('Registration successful! Please log in.');
      navigate('/');
    } catch (err) {
      console.warn('Registration API error:', err);
      const backendError = err.response?.data?.error;
      setErrorMsg(backendError || 'Registration failed. Email may already be registered.');
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
        maxWidth: '460px',
        backgroundColor: '#fff',
        borderRadius: '16px',
        boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05), 0 8px 10px -6px rgba(0,0,0,0.01)',
        padding: '2.5rem',
        border: '1px solid #E2E8F0',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <h1 style={{ color: '#2563EB', fontSize: '2rem', margin: 0, fontWeight: 800 }}>FitVeda</h1>
          <p style={{ color: '#64748B', marginTop: '0.5rem', fontSize: '0.95rem' }}>Create your account to get started</p>
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
            marginBottom: '1.25rem',
          }}>
            {errorMsg}
          </div>
        )}

        {/* Client Role Info Banner */}
        {role === 'CLIENT' && (
          <div style={{
            backgroundColor: '#EFF6FF',
            border: '1px solid #BFDBFE',
            color: '#1E40AF',
            padding: '0.75rem 1rem',
            borderRadius: '8px',
            fontSize: '0.85rem',
            marginBottom: '1.25rem',
          }}>
            💡 <strong>Note for Clients:</strong> After registering, ask your trainer to create and assign a fitness plan to your account.
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
              Account Type *
            </label>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <label style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 0.8rem', border: '1px solid #CBD5E1', borderRadius: '8px', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="role"
                  value="TRAINER"
                  checked={role === 'TRAINER'}
                  onChange={() => setRole('TRAINER')}
                />
                <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Trainer</span>
              </label>
              <label style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 0.8rem', border: '1px solid #CBD5E1', borderRadius: '8px', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="role"
                  value="CLIENT"
                  checked={role === 'CLIENT'}
                  onChange={() => setRole('CLIENT')}
                />
                <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Client</span>
              </label>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
              Full Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Priya Manna"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{
                width: '100%',
                padding: '0.7rem',
                border: '1px solid #CBD5E1',
                borderRadius: '8px',
                fontSize: '0.95rem',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
              Email Address *
            </label>
            <input
              type="email"
              required
              placeholder="e.g. priya@fitveda.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: '100%',
                padding: '0.7rem',
                border: '1px solid #CBD5E1',
                borderRadius: '8px',
                fontSize: '0.95rem',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
              Password (min 8 characters) *
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.7rem',
                  paddingRight: '2.5rem',
                  border: '1px solid #CBD5E1',
                  borderRadius: '8px',
                  fontSize: '0.95rem',
                  boxSizing: 'border-box',
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#64748B',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                }}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
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
            }}
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: '#64748B' }}>
          Already registered?{' '}
          <Link to="/" style={{ color: '#2563EB', fontWeight: 600, textDecoration: 'none' }}>
            Log in here
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
