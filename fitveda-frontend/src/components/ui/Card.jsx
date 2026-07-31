import React from 'react';

const Card = ({ children, className = '', hoverEffect = false, ...props }) => {
  return (
    <div
      className={`bg-white rounded-2xl border border-slate-100 p-6 shadow-md transition-all duration-300
        ${hoverEffect ? 'hover:shadow-lg hover:-translate-y-1 hover:border-slate-200' : ''}
        ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;
