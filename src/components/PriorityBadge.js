import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown } from 'lucide-react';

const config = {
  high:   { label: 'High',   bg: 'var(--high-bg)',   color: 'var(--high-text)',   border: 'var(--high-border)' },
  medium: { label: 'Medium', bg: 'var(--med-bg)',    color: 'var(--med-text)',    border: 'var(--med-border)' },
  low:    { label: 'Low',    bg: 'var(--low-bg)',    color: 'var(--low-text)',    border: 'var(--low-border)' },
};

const PRIORITIES = ['high', 'medium', 'low'];

export default function PriorityBadge({ priority, onSelect }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();
  const c = config[priority] || config.medium;

  useEffect(() => {
    if (!open) return;
    const handle = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    window.addEventListener('mousedown', handle);
    return () => window.removeEventListener('mousedown', handle);
  }, [open]);

  if (!onSelect) return (
    <span style={{ display:'inline-flex', alignItems:'center', padding:'2px 8px', borderRadius:20, fontSize:12, fontWeight:500, background:c.bg, color:c.color, border:`1px solid ${c.border}`, whiteSpace:'nowrap' }}>
      {c.label}
    </span>
  );

  return (
    <span ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <span
        onClick={() => setOpen(o => !o)}
        style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'2px 8px', borderRadius:20, fontSize:12, fontWeight:500, background:c.bg, color:c.color, border:`1px solid ${c.border}`, cursor:'pointer', whiteSpace:'nowrap' }}
      >
        {c.label}
        <ChevronDown size={10} />
      </span>
      {open && (
        <div style={{ position:'absolute', top:'calc(100% + 4px)', left:0, background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--radius-md)', boxShadow:'var(--shadow-md)', zIndex:50, minWidth:110, padding:4 }}>
          {PRIORITIES.map(p => {
            const pc = config[p];
            return (
              <div
                key={p}
                onClick={() => { onSelect(p); setOpen(false); }}
                style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 10px', borderRadius:'var(--radius-sm)', cursor:'pointer', background: p === priority ? 'var(--bg)' : 'transparent' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg)'}
                onMouseLeave={e => e.currentTarget.style.background = p === priority ? 'var(--bg)' : 'transparent'}
              >
                <span style={{ display:'inline-flex', alignItems:'center', padding:'1px 8px', borderRadius:20, fontSize:12, fontWeight:500, background:pc.bg, color:pc.color, border:`1px solid ${pc.border}` }}>{pc.label}</span>
              </div>
            );
          })}
        </div>
      )}
    </span>
  );
}
