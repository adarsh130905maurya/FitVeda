import React, { useState } from 'react';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

const RegisterPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('TRAINER'); // TRAINER or CLIENT
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      setLoading(false);
      return;
    }

    setTimeout(() => {
      setSuccess('Registration successful! Redirecting to login...');
      setLoading(false);
      setTimeout(() => {
        window.location.href = '/';
      }, 1500);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />
      
      <div className="w-full max-w-md z-10 animate-slide-down">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg shadow-blue-500/20 text-white mb-4">
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">FitVeda</h1>
          <p className="text-slate-500 mt-2 font-medium">Join our fitness ecosystem today</p>
        </div>

        <Card className="shadow-xl shadow-slate-100 border border-slate-100/50">
          <h2 className="text-xl font-bold text-slate-800 mb-6 text-center">Create Your Account</h2>
          
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {error && (
              <div className="p-3 bg-red-50 text-red-600 text-sm font-semibold rounded-xl border border-red-100 animate-slide-down">
                {error}
              </div>
            )}
            {success && (
              <div className="p-3 bg-green-50 text-green-600 text-sm font-semibold rounded-xl border border-green-100 animate-slide-down">
                {success}
              </div>
            )}

            {/* Role Switcher */}
            <div className="flex flex-col gap-1.5 w-full">
              <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">I want to register as a</span>
              <div className="bg-slate-100 p-1.5 rounded-2xl flex gap-1 select-none">
                <button
                  type="button"
                  onClick={() => setRole('TRAINER')}
                  className={`flex-1 py-2 text-sm font-bold rounded-xl transition-all duration-200 cursor-pointer ${
                    role === 'TRAINER'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Trainer
                </button>
                <button
                  type="button"
                  onClick={() => setRole('CLIENT')}
                  className={`flex-1 py-2 text-sm font-bold rounded-xl transition-all duration-200 cursor-pointer ${
                    role === 'CLIENT'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Client
                </button>
              </div>
            </div>

            <Input
              label="Full Name"
              id="name"
              type="text"
              placeholder="e.g. Pari Marathe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />

            <Input
              label="Email Address"
              id="email"
              type="email"
              placeholder="e.g. pari@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Input
              label="Password"
              id="password"
              type="password"
              placeholder="Min. 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            {role === 'CLIENT' && (
              <div className="p-3.5 bg-blue-50/50 rounded-xl border border-blue-100 flex items-start gap-2.5 text-blue-700 text-xs leading-relaxed font-medium">
                <svg className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>After registering, your trainer will assign workout and diet plans to you. You can then view and log your daily progress logs.</span>
              </div>
            )}

            <Button type="submit" loading={loading} className="mt-2 w-full py-3.5">
              Create Account
            </Button>
          </form>

          <div className="text-center mt-6">
            <span className="text-sm text-slate-500">
              Already have an account?{' '}
              <a href="/" className="font-semibold text-blue-600 hover:text-blue-700 transition-colors">
                Sign in here
              </a>
            </span>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default RegisterPage;
