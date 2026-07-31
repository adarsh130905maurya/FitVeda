import React from 'react';

const Badge = ({ children, variant = 'WORKOUT', className = '' }) => {
  const styles = {
    WORKOUT: 'bg-blue-50 text-blue-700 border-blue-100',
    DIET: 'bg-amber-50 text-amber-700 border-amber-100',
    COMPLETED: 'bg-green-50 text-green-700 border-green-100',
    MISSED: 'bg-red-50 text-red-700 border-red-100'
  };

  const currentStyle = styles[variant.toUpperCase()] || 'bg-slate-50 text-slate-700 border-slate-100';

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-semibold border ${currentStyle} ${className}`}
    >
      {children}
    </span>
  );
};

export default Badge;
