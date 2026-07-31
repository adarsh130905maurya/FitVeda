import React from 'react';

const NavBar = ({ userName = 'Guest', onLogout, className = '' }) => {
  return (
    <nav className={`bg-white border-b border-slate-100 shadow-sm sticky top-0 z-40 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center gap-2">
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent flex items-center gap-1.5">
                <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                FitVeda
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex flex-col text-right hidden sm:flex">
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Welcome back</span>
              <span className="text-sm font-semibold text-slate-700">{userName}</span>
            </div>
            
            <button
              onClick={onLogout}
              className="inline-flex items-center gap-1.5 px-4 py-2 border border-slate-200 text-sm font-semibold rounded-xl text-slate-600 bg-white hover:bg-slate-50 transition-all duration-200 active:scale-[0.98] shadow-sm cursor-pointer"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default NavBar;
