import { Loader2 } from 'lucide-react';

export default function Button({ 
  children, 
  onClick, 
  disabled, 
  variant = 'primary', 
  icon: Icon,
  isLoading,
  className = ''
}) {
  const variants = {
    primary: 'text-white hover:opacity-90 shadow-lg disabled:bg-slate-300 disabled:shadow-none disabled:opacity-50',
    secondary: 'bg-white border-2 border-teal-500 text-teal-700 hover:bg-teal-50 disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-300',
    danger: 'text-white hover:opacity-90 shadow-lg disabled:bg-slate-300 disabled:shadow-none',
    ghost: 'bg-slate-100 text-slate-700 hover:bg-teal-50 hover:text-teal-700 disabled:bg-slate-50 disabled:text-slate-400'
  };

  const getBackground = () => {
    if (variant === 'primary') {
      return 'linear-gradient(135deg, #FF6B6B 0%, #FF5252 100%)';
    }
    if (variant === 'danger') {
      return 'linear-gradient(135deg, #f43f5e 0%, #ec4899 100%)';
    }
    return 'transparent';
  };

  const getShadow = () => {
    if (variant === 'primary') {
      return '0 10px 25px -5px rgba(255, 107, 107, 0.4)';
    }
    if (variant === 'danger') {
      return '0 10px 25px -5px rgba(244, 63, 94, 0.4)';
    }
    return 'none';
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`flex items-center gap-2.5 px-6 py-3.5 rounded-2xl font-semibold transition-all duration-200 ${variants[variant]} ${className}`}
      style={{
        background: getBackground(),
        boxShadow: getShadow()
      }}
    >
      {isLoading ? (
        <Loader2 className="w-[22px] h-[22px] animate-spin shrink-0" />
      ) : Icon ? (
        <Icon className="w-[22px] h-[22px] shrink-0" />
      ) : null}
      {children}
    </button>
  );
}
