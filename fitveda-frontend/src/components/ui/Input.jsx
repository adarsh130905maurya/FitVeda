import React from 'react';

const Input = ({
  label,
  id,
  type = 'text',
  error,
  placeholder,
  value,
  onChange,
  className = '',
  required = false,
  ...props
}) => {
  return (
    <div className={`flex flex-col gap-1.5 w-full ${className}`}>
      {label && (
        <label htmlFor={id} className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
          {label} {required && <span className="text-danger">*</span>}
        </label>
      )}
      <input
        type={type}
        id={id}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        className={`px-4 py-3 border rounded-xl text-sm transition-all duration-200 bg-white placeholder-slate-400
          ${error 
            ? 'border-danger focus:ring-2 focus:ring-red-500/20 focus:border-danger' 
            : 'border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-primary'
          } outline-none focus:outline-none`}
        {...props}
      />
      {error && (
        <span className="text-xs font-medium text-danger transition-all duration-200 animate-slide-down">
          {error}
        </span>
      )}
    </div>
  );
};

export default Input;
