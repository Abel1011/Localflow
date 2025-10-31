export default function SectionHeader({ icon: Icon, title, subtitle, iconBg = 'coral' }) {
  const bgStyles = {
    coral: { bg: 'linear-gradient(135deg, #FF6B6B 0%, #FF5252 100%)', shadow: '0 10px 25px -5px rgba(255, 107, 107, 0.4)' },
    teal: { bg: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)', shadow: '0 10px 25px -5px rgba(20, 184, 166, 0.4)' },
    amber: { bg: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', shadow: '0 10px 25px -5px rgba(245, 158, 11, 0.4)' }
  };

  const style = bgStyles[iconBg] || bgStyles.coral;

  return (
    <div className="flex items-center gap-4 mb-8">
      <div 
        className="p-3 rounded-2xl"
        style={{ background: style.bg, boxShadow: style.shadow }}
      >
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div>
        <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
        {subtitle && <p className="text-sm text-slate-500 font-medium">{subtitle}</p>}
      </div>
    </div>
  );
}
