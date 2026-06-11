import React from 'react';

const config = {
  high:   { label: 'High',   bg: 'var(--high-bg)',   color: 'var(--high-text)',   border: 'var(--high-border)' },
  medium: { label: 'Medium', bg: 'var(--med-bg)',    color: 'var(--med-text)',    border: 'var(--med-border)' },
  low:    { label: 'Low',    bg: 'var(--low-bg)',    color: 'var(--low-text)',    border: 'var(--low-border)' },
};

export default function PriorityBadge({ priority }) {
  const c = config[priority] || config.medium;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '2px 8px',
      borderRadius: '20px',
      fontSize: '12px', fontWeight: 500,
      background: c.bg, color: c.color,
      border: `1px solid ${c.border}`,
      whiteSpace: 'nowrap',
    }}>
      {c.label}
    </span>
  );
}
