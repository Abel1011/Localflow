export default function StatusBadge({ status, icon: Icon, text }) {
  const statusStyles = {
    available: {
      bg: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 50%, #6ee7b7 100%)',
      border: 'border-emerald-300/60',
      text: 'text-emerald-900',
      icon: 'text-emerald-600',
      shadow: '0 8px 20px -5px rgba(16, 185, 129, 0.3)'
    },
    downloadable: {
      bg: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 50%, #93c5fd 100%)',
      border: 'border-sky-300/60',
      text: 'text-sky-900',
      icon: 'text-sky-600',
      shadow: '0 8px 20px -5px rgba(14, 165, 233, 0.3)'
    },
    downloading: {
      bg: 'linear-gradient(135deg, #fed7aa 0%, #fdba74 50%, #fb923c 100%)',
      border: 'border-amber-300/60',
      text: 'text-amber-900',
      icon: 'text-amber-600',
      shadow: '0 8px 20px -5px rgba(245, 158, 11, 0.3)'
    },
    unavailable: {
      bg: 'linear-gradient(135deg, #fecdd3 0%, #fda4af 50%, #fb7185 100%)',
      border: 'border-rose-300/60',
      text: 'text-rose-900',
      icon: 'text-rose-600',
      shadow: '0 8px 20px -5px rgba(244, 63, 94, 0.3)'
    },
    default: {
      bg: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 50%, #cbd5e1 100%)',
      border: 'border-slate-300/60',
      text: 'text-slate-900',
      icon: 'text-slate-600',
      shadow: '0 8px 20px -5px rgba(100, 116, 139, 0.2)'
    }
  };

  const styles = statusStyles[status] || statusStyles.default;

  return (
    <div 
      className={`p-5 border-2 ${styles.border} rounded-2xl`}
      style={{ background: styles.bg, boxShadow: styles.shadow }}
    >
      <div className="flex items-center gap-3">
        <Icon className={`w-5 h-5 ${styles.icon} ${status === 'downloading' ? 'animate-spin' : ''}`} />
        <p className={`font-semibold ${styles.text}`}>{text}</p>
      </div>
    </div>
  );
}
