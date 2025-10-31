'use client';

import { useEffect } from 'react';
import { X, AlertCircle, CheckCircle, Info } from 'lucide-react';

export default function Toast({ message, type = 'error', onClose, duration = 5000 }) {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const config = {
    error: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-800',
      icon: AlertCircle,
      iconColor: 'text-red-500'
    },
    success: {
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      text: 'text-emerald-800',
      icon: CheckCircle,
      iconColor: 'text-emerald-500'
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-800',
      icon: Info,
      iconColor: 'text-blue-500'
    }
  };

  const { bg, border, text, icon: Icon, iconColor } = config[type];

  return (
    <div className={`${bg} ${border} border-2 rounded-lg p-4 shadow-lg max-w-md flex items-start gap-3`}>
      <Icon className={`w-5 h-5 ${iconColor} shrink-0 mt-0.5`} />
      <p className={`text-sm font-medium ${text} flex-1`}>{message}</p>
      <button
        onClick={onClose}
        className={`${text} hover:opacity-70 transition-opacity`}
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
