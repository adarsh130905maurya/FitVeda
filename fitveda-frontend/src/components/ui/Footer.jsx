import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 py-6 mt-12 text-center text-sm font-medium">
      <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-4">
        <p className="m-0">© {new Date().getFullYear()} FitVeda. Crafted with for fitness excellence.</p>
        <div className="flex gap-6 text-xs text-slate-400">
          <span className="hover:text-white cursor-pointer transition-colors">Privacy Policy</span>
          <span className="hover:text-white cursor-pointer transition-colors">Terms of Service</span>
          <span className="hover:text-white cursor-pointer transition-colors">Support</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
