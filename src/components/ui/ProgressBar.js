export default function ProgressBar({ progress, label }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-slate-700">{label}</span>
        <span className="text-sm font-bold text-coral-600" style={{ '--coral-600': '#FF5252', color: 'var(--coral-600)' }}>{progress}%</span>
      </div>
      <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden shadow-inner">
        <div 
          className="h-3 rounded-full transition-all duration-500 ease-out shadow-lg"
          style={{ 
            width: `${progress}%`,
            background: 'linear-gradient(90deg, #14b8a6 0%, #0d9488 50%, #FF6B6B 100%)',
            boxShadow: '0 4px 14px 0 rgba(20, 184, 166, 0.5)'
          }}
        ></div>
      </div>
    </div>
  );
}
