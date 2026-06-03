import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, XCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const toast = useCallback((message, type = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);

    // Auto remove after 4 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const dismiss = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const config = {
    success: { icon: CheckCircle2, color: '#38a169', bg: '#f0fff4', border: '#38a169', title: 'Success' },
    error:   { icon: XCircle,      color: '#e53e3e', bg: '#fff5f5', border: '#e53e3e', title: 'Error' },
    info:    { icon: Info,         color: '#3182ce', bg: '#ebf8ff', border: '#3182ce', title: 'Info' }
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div id="toast-container">
        {toasts.map((t) => {
          const c = config[t.type] || config.success;
          const Icon = c.icon;
          return (
            <div key={t.id} className="toast-modern" style={{ background: c.bg, borderLeft: `4px solid ${c.border}` }}>
              <div className="toast-modern-icon" style={{ color: c.color }}>
                <Icon size={20} />
              </div>
              <div className="toast-modern-content">
                <div className="toast-modern-title" style={{ color: c.color }}>{c.title}</div>
                <div className="toast-modern-message">{t.message}</div>
              </div>
              <button className="toast-modern-close" onClick={() => dismiss(t.id)}>
                <X size={14} />
              </button>
              <div className="toast-modern-progress" style={{ background: c.color }}></div>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context.toast;
}
