import { useState, useEffect, useRef } from 'react';
import { useDebounce } from '../hooks/useDebounce';

export const SmartItemInput = ({ value, onChange, masterList = [], placeholder = '' }) => {
  const [open, setOpen]         = useState(false);
  const [inputValue, setInputValue] = useState(value || '');
  const [suggestion, setSuggestion] = useState(null);
  const ref = useRef(null);

  const debouncedInput = useDebounce(inputValue, 300);

  // Sync external value → local
  useEffect(() => {
    if (value !== inputValue) setInputValue(value || '');
  }, [value]); // eslint-disable-line

  // Close on outside click
  useEffect(() => {
    const handler = e => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Levenshtein "did you mean?" suggestion
  useEffect(() => {
    setSuggestion(null);
    const trimmed = debouncedInput.trim().toLowerCase();
    if (trimmed.length >= 5 && masterList.length && trimmed.length < 500) {
      const exact = masterList.some(i => i.name.toLowerCase() === trimmed);
      if (!exact) {
        let best = null;
        let bestDist = 3;
        
        // Optimization: Pre-filter by first letter and cap candidates to avoid long iterations
        const firstLetter = trimmed[0];
        let candidates = masterList.filter(i => i.name.toLowerCase()[0] === firstLetter);
        if (candidates.length > 50) candidates = candidates.slice(0, 50);

        candidates.forEach(i => {
          const n = i.name.toLowerCase();
          if (Math.abs(n.length - trimmed.length) <= 2) {
            const d = lev(trimmed, n);
            if (d < bestDist) { bestDist = d; best = i.name; }
          }
        });
        if (best) setSuggestion(best);
      }
    }
  }, [debouncedInput, masterList]);

  const handleChange = e => {
    const v = e.target.value;
    setInputValue(v);
    onChange(v);
    setOpen(true);
  };

  const handleSelect = name => {
    setInputValue(name);
    onChange(name);
    setSuggestion(null);
    setOpen(false);
  };

  // Filter as user types; show all when field is empty / just focused
  const q = debouncedInput.trim().toLowerCase();
  const filtered = q
    ? masterList.filter(i => i.name.toLowerCase().includes(q))
    : masterList;

  return (
    <div ref={ref} style={{ position: 'relative', width: '100%' }}>

      {/* ── Input field ── */}
      <input
        type="text"
        value={inputValue}
        onChange={handleChange}
        onFocus={() => setOpen(true)}
        placeholder={placeholder || 'Search or select from list…'}
        autoComplete="off"
        style={{
          width: '100%',
          padding: '9px 12px',
          border: '1.5px solid #e2e8f0',
          borderRadius: '7px',
          fontSize: '13px',
          backgroundColor: '#fff',
          boxSizing: 'border-box',
        }}
      />

      {/* ── "Did you mean?" hint ── */}
      {suggestion && (
        <div style={{
          marginTop: '4px',
          fontSize: '11px',
          color: '#c05621',
          background: '#fffaf0',
          padding: '4px 8px',
          borderRadius: '4px',
          border: '1px solid #feebc8',
        }}>
          Did you mean:{' '}
          <strong
            style={{ cursor: 'pointer', textDecoration: 'underline' }}
            onClick={() => handleSelect(suggestion)}
          >
            {suggestion}
          </strong>?
        </div>
      )}

      {/* ── Dropdown list ── */}
      {open && (
        <div style={{
          position: 'absolute',
          top: suggestion ? 'calc(100% + 28px)' : 'calc(100% + 4px)',
          left: 0,
          right: 0,
          zIndex: 2000,
          background: '#2d3748',
          border: '1px solid #4a5568',
          borderRadius: '8px',
          boxShadow: '0 10px 32px rgba(0,0,0,0.45)',
          maxHeight: '280px',
          overflowY: 'auto',
          marginTop: '2px',
        }}>

          {/* Header */}
          <div style={{
            padding: '8px 14px',
            fontSize: '11px',
            color: '#a0aec0',
            borderBottom: '1px solid #4a5568',
            fontWeight: 600,
            letterSpacing: '0.04em',
            userSelect: 'none',
          }}>
            — Select from list —
          </div>

          {filtered.length > 0 ? (
            filtered.map((item, idx) => (
              <Row
                key={idx}
                label={item.name}
                isSelected={item.name.toLowerCase() === inputValue.trim().toLowerCase()}
                query={q}
                onSelect={() => handleSelect(item.name)}
              />
            ))
          ) : (
            <div style={{
              padding: '12px 16px',
              fontSize: '12px',
              color: '#718096',
              fontStyle: 'italic',
              textAlign: 'center',
            }}>
              {q ? 'No match — will be saved to Master List' : 'Master List is empty'}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/* ── Single dropdown row ── */
function Row({ label, isSelected, query, onSelect }) {
  const [hovered, setHovered] = useState(false);

  // Highlight matched portion
  let content = label;
  if (query) {
    const idx = label.toLowerCase().indexOf(query);
    if (idx >= 0) {
      content = (
        <>
          {label.substring(0, idx)}
          <strong style={{ color: '#90cdf4' }}>{label.substring(idx, idx + query.length)}</strong>
          {label.substring(idx + query.length)}
        </>
      );
    }
  }

  return (
    <div
      onMouseDown={onSelect}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '9px 14px',
        fontSize: '13px',
        cursor: 'pointer',
        color: hovered ? '#fff' : (isSelected ? '#90cdf4' : '#e2e8f0'),
        background: hovered ? '#3182ce' : (isSelected ? '#2a4a7f' : 'transparent'),
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        transition: 'background 0.1s',
        userSelect: 'none',
      }}
    >
      <span style={{ width: '14px', flexShrink: 0, color: '#63b3ed', fontWeight: 700 }}>
        {isSelected ? '✓' : ''}
      </span>
      <span>{content}</span>
    </div>
  );
}

/* ── Levenshtein distance ── */
function lev(a, b) {
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const m = Array.from({ length: b.length + 1 }, (_, i) => [i]);
  for (let j = 0; j <= a.length; j++) m[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      m[i][j] = b[i - 1] === a[j - 1]
        ? m[i - 1][j - 1]
        : Math.min(m[i - 1][j - 1] + 1, m[i][j - 1] + 1, m[i - 1][j] + 1);
    }
  }
  return m[b.length][a.length];
}
