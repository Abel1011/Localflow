export default function Input({ 
  label, 
  icon: Icon, 
  value, 
  onChange, 
  disabled, 
  placeholder,
  type = 'text',
  className = ''
}) {
  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
          {Icon && <Icon className="w-4 h-4 text-coral-500" style={{ '--coral-500': '#FF6B6B', color: 'var(--coral-500)' }} />}
          {label}
        </label>
      )}
      <input
        type={type}
        value={value}
        onChange={onChange}
        disabled={disabled}
        placeholder={placeholder}
        className="w-full border-2 border-slate-200 rounded-2xl px-5 py-3.5 font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-teal-400 focus:ring-4 focus:ring-teal-400/20 transition-all disabled:bg-slate-50 disabled:text-slate-400"
      />
    </div>
  );
}
