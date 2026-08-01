import React from 'react';

const NavBar = ({ userName = 'User', onLogout, logout, className = '' }) => {
  const handleLogout = onLogout || logout;

  return (
    <nav className={`glass-nav sticky top-0 z-50 text-slate-100 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          
          {/* Logo & Tagline */}
          <div className="flex items-center gap-3 cursor-pointer select-none">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-green-600 rounded-2xl blur opacity-40 group-hover:opacity-75 transition duration-300"></div>
              <img 
                src="/fitveda-logo.png" 
                alt="FitVeda Logo" 
                className="relative h-12 w-auto object-contain bg-white/95 p-1 rounded-xl shadow-md border border-white/20" 
              />
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-extrabold tracking-tight flex items-center gap-1">
                <span className="text-white">FIT</span>
                <span className="text-emerald-500 bg-gradient-to-r from-emerald-400 to-green-500 bg-clip-text text-transparent">VEDA</span>
              </span>
              <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 -mt-1 hidden sm:block">
                Train Smart • Eat Right • Live Better
              </span>
            </div>
          </div>

          {/* User Profile & Logout Action */}
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-3 px-4 py-2 rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-inner">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-bold flex items-center justify-center text-sm shadow-sm">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div className="flex flex-col text-left">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Signed in as</span>
                <span className="text-sm font-semibold text-slate-200 leading-tight">{userName}</span>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-200 bg-slate-800/80 hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/40 border border-slate-700/80 transition-all duration-200 active:scale-95 shadow-md cursor-pointer"
              title="Logout of FitVeda"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Logout</span>
            </button>

          </div>

        </div>
      </div>
    </nav>
  );
};

export default NavBar;
