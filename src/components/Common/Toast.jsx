import React from 'react';
import { X, AlertCircle, CheckCircle2 } from 'lucide-react';

export const Toast = ({ message, type, onClose }) => {
  const styles = {
    error: 'bg-red-50 text-red-600 border border-red-100',
    success: 'bg-emerald-50 text-emerald-600 border border-emerald-100',
    info: 'bg-blue-50 text-blue-600 border border-blue-100'
  };
  const icons = {
    error: <AlertCircle size={18} />,
    success: <CheckCircle2 size={18} />,
    info: <AlertCircle size={18} />
  };
  
  return (
    <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-md border transform transition-all duration-300 animate-in slide-in-from-right-5 ${styles[type] || styles.success}`}>
      {icons[type] || icons.success}
      <p className="text-sm font-medium">{message}</p>
      <button onClick={onClose} className="ml-2 hover:opacity-70"><X size={14} /></button>
    </div>
  );
};
