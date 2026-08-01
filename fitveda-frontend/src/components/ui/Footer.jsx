import React from 'react';

const Footer = () => {
  return (
    <footer className="glass-nav border-t border-slate-800/80 text-slate-400 py-8 mt-16 text-sm font-medium">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
        
        {/* Brand & Tagline */}
        <div className="flex items-center gap-3">
          <img 
            src="/fitveda-logo.png" 
            alt="FitVeda Logo" 
            className="h-8 w-auto bg-white/90 p-0.5 rounded-lg border border-white/20" 
          />
          <div className="flex flex-col text-left">
            <span className="text-base font-extrabold text-slate-200 tracking-tight">
              FIT<span className="text-emerald-500">VEDA</span>
            </span>
            <span className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase">
              Train Smart • Eat Right • Live Better
            </span>
          </div>
        </div>

        {/* Copyright */}
        <p className="m-0 text-slate-400 text-xs text-center">
          © {new Date().getFullYear()} FitVeda. Crafted with ❤️ for fitness excellence & health engineering.
        </p>

        {/* Quick Links */}
        <div className="flex items-center gap-6 text-xs font-semibold text-slate-400">
          <span className="hover:text-emerald-400 cursor-pointer transition-colors">Privacy Policy</span>
          <span className="hover:text-emerald-400 cursor-pointer transition-colors">Terms of Service</span>
          <span className="hover:text-emerald-400 cursor-pointer transition-colors">Support</span>
        </div>

      </div>
    </footer>
  );
};

export default Footer;
