import React from 'react';
import Spinner from './Spinner';

const Button = ({
  children,
  variant = 'primary',
  type = 'button',
  onClick,
  disabled = false,
  loading = false,
  className = '',
  ...props
}) => {
  const baseStyle = 'inline-flex items-center justify-center px-6 py-3 border border-transparent text-sm font-semibold rounded-xl shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 transform active:scale-[0.98] select-none';
  
  const variants = {
    primary: 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-blue-500/20 focus:ring-blue-500',
    secondary: 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 focus:ring-slate-500 shadow-slate-100',
    danger: 'bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white shadow-red-500/20 focus:ring-red-500',
    disabled: 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed transform-none shadow-none active:scale-100'
  };

  const selectedVariant = (disabled || loading) ? variants.disabled : variants[variant];

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseStyle} ${selectedVariant} ${className}`}
      {...props}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <Spinner size="sm" color={variant === 'secondary' ? 'text-slate-500' : 'text-white'} />
          <span>Please wait...</span>
        </span>
      ) : (
        children
      )}
    </button>
  );
};

export default Button;
