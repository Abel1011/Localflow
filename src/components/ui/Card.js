export default function Card({ children, className = '', gradient = false }) {
  const baseClass = gradient 
    ? 'border-2 border-slate-200/60' 
    : 'bg-white border-2 border-slate-200/60';
  
  const style = gradient 
    ? { 
        background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 50%, #f1f5f9 100%)',
        boxShadow: '0 20px 50px -12px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.02)'
      }
    : {
        boxShadow: '0 20px 50px -12px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.02)'
      };
    
  return (
    <div 
      className={`${baseClass} rounded-3xl p-8 backdrop-blur-sm ${className}`}
      style={style}
    >
      {children}
    </div>
  );
}
