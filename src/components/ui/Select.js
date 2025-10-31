export default function Select({ 
  label, 
  icon: Icon, 
  value, 
  onChange, 
  disabled, 
  options,
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
      <select
        value={value}
        onChange={onChange}
        disabled={disabled}
        className="w-full border-2 border-slate-200 rounded-2xl px-5 py-3.5 font-medium text-slate-900 focus:outline-none focus:border-teal-400 focus:ring-4 focus:ring-teal-400/20 transition-all disabled:bg-slate-50 disabled:text-slate-400 appearance-none bg-white cursor-pointer"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2314b8a6'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 1rem center',
          backgroundSize: '1.5rem',
          paddingRight: '3rem'
        }}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
