import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { resetPassword as resetPasswordApi } from '../services/api';

const ForgotPasswordPage = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (newPassword.length < 8) {
      setErrorMsg('New password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match. Please retype carefully.');
      return;
    }

    setLoading(true);

    try {
      const response = await resetPasswordApi({
        email: email.trim(),
        newPassword,
      });

      setSuccessMsg(response.data?.message || 'Password reset successfully! Redirecting to login...');
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (err) {
      console.warn('Password reset error:', err);
      const backendDetails = err.response?.data?.details;
      if (backendDetails && typeof backendDetails === 'object') {
        const messages = Object.values(backendDetails).join('. ');
        setErrorMsg(messages);
      } else {
        const backendError = err.response?.data?.error;
        setErrorMsg(backendError || 'Failed to reset password. Please check your email address.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 relative overflow-hidden bg-radial-gradient">
      
      {/* Ambient Glow Orbs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/15 blur-3xl rounded-full pointer-events-none animate-pulse-slow"></div>
      <div className="absolute bottom-10 left-10 w-80 h-80 bg-green-600/10 blur-3xl rounded-full pointer-events-none"></div>

      <div className="w-full max-w-md glass-card rounded-3xl p-8 sm:p-10 border border-slate-800/80 shadow-2xl relative z-10">
        
        {/* Brand Logo Header */}
        <div className="text-center mb-8 flex flex-col items-center">
          <div className="relative group mb-4">
            <div className="absolute -inset-1.5 bg-gradient-to-r from-emerald-500 to-green-600 rounded-2xl blur opacity-50 group-hover:opacity-80 transition duration-300"></div>
            <img 
              src="/fitveda-logo.png" 
              alt="FitVeda Logo" 
              className="relative h-16 w-auto object-contain bg-white/95 p-1.5 rounded-2xl shadow-xl border border-white/20" 
            />
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight text-white m-0 flex items-center gap-1">
            FIT<span className="text-emerald-500 bg-gradient-to-r from-emerald-400 to-green-500 bg-clip-text text-transparent">VEDA</span>
          </h1>
          <p className="text-xs uppercase tracking-widest font-bold text-slate-400 mt-1">
            Reset Your Password
          </p>
          <p className="text-xs text-slate-400 mt-2 max-w-xs">
            Enter your registered email and choose a secure new password.
          </p>
        </div>

        {/* Alerts */}
        {errorMsg && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-300 p-3.5 rounded-xl text-sm mb-6 flex items-center gap-2">
            <svg className="w-5 h-5 text-red-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 p-3.5 rounded-xl text-sm mb-6 flex items-center gap-2">
            <svg className="w-5 h-5 text-emerald-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Registered Email Address
            </label>
            <input
              type="email"
              required
              placeholder="user@fitveda.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-slate-900/90 border border-slate-800 text-slate-100 rounded-xl text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all duration-200 placeholder:text-slate-500"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                New Password
              </label>
              <span className="text-[11px] text-slate-400 font-medium">(Min. 8 characters)</span>
            </div>
            <input
              type="password"
              required
              minLength={8}
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-3 bg-slate-900/90 border border-slate-800 text-slate-100 rounded-xl text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all duration-200 placeholder:text-slate-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Confirm New Password
            </label>
            <input
              type="password"
              required
              minLength={8}
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 bg-slate-900/90 border border-slate-800 text-slate-100 rounded-xl text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all duration-200 placeholder:text-slate-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 mt-3 bg-gradient-to-r from-emerald-600 via-green-600 to-emerald-700 hover:from-emerald-500 hover:to-green-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/20 transition-all duration-200 active:scale-[0.98] cursor-pointer disabled:opacity-50 text-sm tracking-wide"
          >
            {loading ? 'Updating Password...' : 'Reset Password'}
          </button>
        </form>

        <div className="text-center mt-8 text-sm text-slate-400 font-medium">
          Remember your password?{' '}
          <Link to="/" className="text-emerald-400 hover:text-emerald-300 font-bold underline underline-offset-4 transition-colors">
            Log in here
          </Link>
        </div>

      </div>
    </div>
  );
};

export default ForgotPasswordPage;
