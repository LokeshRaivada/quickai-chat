import React from 'react';

const Button = ({ 
  children, 
  variant = "primary", 
  onClick, 
  className = "", 
  disabled = false, 
  loading = false,
  fullWidth = true
}) => {
  const baseStyles = `px-6 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${fullWidth ? 'w-full' : ''}`;
  
  const variants = {
    primary: "gradient-primary glow-button border border-white/10",
    secondary: "bg-[#1E293B]/80 backdrop-blur-md text-slate-200 border border-white/10 hover:bg-slate-800 hover:text-white hover:border-indigo-500/50 disabled:opacity-50",
    ghost: "bg-transparent text-indigo-400 hover:bg-indigo-500/10 hover:text-indigo-300 font-bold",
    danger: "bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20"
  };

  return (
    <button
      onClick={!loading && !disabled ? onClick : undefined}
      disabled={disabled || loading}
      className={`${baseStyles} ${variants[variant]} ${className}`}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <svg className="animate-spin h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Processing...
        </span>
      ) : children}
    </button>
  );
};

export default Button;
