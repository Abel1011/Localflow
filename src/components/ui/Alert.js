export default function Alert({ type = 'info', icon: Icon, title, children }) {
  const types = {
    info: {
      bg: 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 50%, #7dd3fc 100%)',
      border: 'border-sky-300/70',
      iconBg: 'bg-sky-100',
      iconColor: 'text-sky-700',
      titleColor: 'text-sky-900',
      textColor: 'text-sky-800',
      shadow: '0 8px 20px -5px rgba(14, 165, 233, 0.3)'
    },
    warning: {
      bg: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 50%, #fcd34d 100%)',
      border: 'border-amber-300/70',
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-700',
      titleColor: 'text-amber-900',
      textColor: 'text-amber-800',
      shadow: '0 8px 20px -5px rgba(245, 158, 11, 0.3)'
    },
    error: {
      bg: 'linear-gradient(135deg, #ffe4e6 0%, #fecdd3 50%, #fda4af 100%)',
      border: 'border-rose-300/70',
      iconBg: 'bg-rose-100',
      iconColor: 'text-rose-700',
      titleColor: 'text-rose-900',
      textColor: 'text-rose-800',
      shadow: '0 8px 20px -5px rgba(244, 63, 94, 0.3)'
    },
    success: {
      bg: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 50%, #6ee7b7 100%)',
      border: 'border-emerald-300/70',
      iconBg: 'bg-emerald-100',
      iconColor: 'text-emerald-700',
      titleColor: 'text-emerald-900',
      textColor: 'text-emerald-800',
      shadow: '0 8px 20px -5px rgba(16, 185, 129, 0.3)'
    }
  };

  const style = types[type];

  return (
    <div 
      className={`border-2 ${style.border} rounded-2xl p-6`}
      style={{ background: style.bg, boxShadow: style.shadow }}
    >
      <div className="flex items-start gap-4">
        {Icon && (
          <div className={`p-2.5 ${style.iconBg} rounded-xl`}>
            <Icon className={`w-5 h-5 ${style.iconColor}`} />
          </div>
        )}
        <div className="flex-1">
          {title && <h4 className={`font-bold ${style.titleColor} mb-2`}>{title}</h4>}
          <div className={`${style.textColor}`}>{children}</div>
        </div>
      </div>
    </div>
  );
}
