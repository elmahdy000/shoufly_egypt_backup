import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'soft' | 'success' | 'ghost' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  isLoading, 
  className = '', 
  ...props 
}) => {
  const baseStyles = "inline-flex items-center justify-center font-bold transition-all duration-300 active:scale-[0.96] disabled:opacity-50 disabled:pointer-events-none rounded-xl";
  
  const variants = {
    primary: "bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/20 border-2 border-transparent",
    secondary: "bg-white text-slate-700 border-2 border-slate-200 hover:border-slate-300 hover:text-slate-900 hover:bg-slate-50",
    soft: "bg-slate-100 text-slate-700 border-2 border-transparent hover:bg-slate-200",
    success: "bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-200 border-2 border-transparent",
    outline: "bg-transparent border-2 border-slate-200 text-slate-600 hover:border-primary hover:text-primary hover:bg-primary/5",
    ghost: "bg-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-100 border-2 border-transparent",
    danger: "bg-rose-600 text-white hover:bg-rose-700 shadow-lg shadow-rose-200 border-2 border-transparent",
  };
  
  const sizes = {
    sm: "px-4 py-2 text-xs",
    md: "px-6 py-3 text-sm",
    lg: "px-10 py-4 text-base",
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin ml-2" />
      ) : null}
      {children}
    </button>
  );
};
