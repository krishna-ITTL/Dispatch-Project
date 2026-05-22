import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

const Topbar = () => {
  const [time, setTime] = useState(new Date().toLocaleString());
  const [activeShift, setActiveShift] = useState('Shift 1');

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toLocaleString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const shifts = ['Shift 1', 'Shift 2', 'Shift 3'];

  return (
    <div style={{
      height: '70px',
      background: 'var(--header-bg)',
      borderBottom: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      padding: '0 24px',
      justifyContent: 'space-between'
    }}>
      <div style={{ display: 'flex', gap: '8px' }}>
        {shifts.map(shift => (
          <button
            key={shift}
            onClick={() => setActiveShift(shift)}
            style={{
              padding: '6px 16px',
              borderRadius: '20px',
              border: `1px solid ${activeShift === shift ? 'transparent' : 'var(--shift-border)'}`,
              background: activeShift === shift ? 'var(--shift-active-bg)' : 'var(--shift-bg)',
              color: activeShift === shift ? 'var(--shift-active-text)' : '#a0aec0',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: '600',
              fontFamily: "'DM Sans', sans-serif",
              transition: 'all 0.2s'
            }}
          >
            {shift}
          </button>
        ))}
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        color: '#fff',
        background: 'rgba(255,255,255,0.05)',
        padding: '8px 16px',
        borderRadius: '20px',
        fontSize: '13px',
        fontFamily: "'DM Mono', monospace"
      }}>
        <Clock size={14} color="#e53e3e" />
        {time}
      </div>
    </div>
  );
};

export default Topbar;
