import React, { useEffect, useState } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';
import { toast, ToastItem } from '../utils/toast';

export const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    return toast.subscribe(setToasts);
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '24px',
      right: '24px',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      zIndex: 9999,
      maxWidth: '380px'
    }}>
      {toasts.map((t) => {
        let icon = <Info size={16} color="#00e5ff" />;
        let border = '1px solid rgba(0, 229, 255, 0.4)';
        let bg = 'rgba(15, 23, 42, 0.95)';

        if (t.type === 'success') {
          icon = <CheckCircle2 size={16} color="#4caf50" />;
          border = '1px solid rgba(76, 175, 80, 0.4)';
        } else if (t.type === 'warn') {
          icon = <AlertTriangle size={16} color="#ff9800" />;
          border = '1px solid rgba(255, 152, 0, 0.4)';
        } else if (t.type === 'error') {
          icon = <AlertCircle size={16} color="var(--accent-red)" />;
          border = '1px solid rgba(255, 70, 85, 0.4)';
        }

        return (
          <div
            key={t.id}
            style={{
              background: bg,
              border,
              borderRadius: '8px',
              padding: '12px 14px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
              backdropFilter: 'blur(8px)',
              animation: 'slideInRight 0.2s ease-out'
            }}
          >
            <div style={{ marginTop: '2px' }}>{icon}</div>
            <div style={{ flex: 1, fontSize: '13px', color: '#f8fafc', lineHeight: 1.4 }}>
              {t.message}
            </div>
            <button
              onClick={() => toast.dismiss(t.id)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '2px',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
};
