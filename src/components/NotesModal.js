import React, { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';

export default function NotesModal({ task, onSave, onClose }) {
  const [notes, setNotes] = useState(task.notes || '');
  const textareaRef = useRef();

  useEffect(() => {
    textareaRef.current?.focus();
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <div style={styles.overlay} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={styles.modal} role="dialog" aria-modal="true">
        <div style={styles.header}>
          <div>
            <h2 style={styles.title}>Notes</h2>
            <p style={styles.taskName}>{task.name}</p>
          </div>
          <button style={styles.closeBtn} onClick={onClose} aria-label="Close"><X size={18} /></button>
        </div>
        <div style={styles.body}>
          <textarea
            ref={textareaRef}
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Add a note…"
            style={styles.textarea}
            dir="auto"
          />
        </div>
        <div style={styles.footer}>
          <button style={styles.cancelBtn} onClick={onClose}>Cancel</button>
          <button style={styles.saveBtn} onClick={() => onSave(task, notes)}>Save</button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: { position:'fixed', inset:0, background:'rgba(0,0,0,0.35)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100, padding:'1rem' },
  modal: { background:'var(--surface)', borderRadius:'var(--radius-lg)', width:'100%', maxWidth:'480px', boxShadow:'var(--shadow-md)', overflow:'hidden' },
  header: { display:'flex', alignItems:'flex-start', justifyContent:'space-between', padding:'1.25rem 1.5rem 1rem', borderBottom:'1px solid var(--border)' },
  title: { fontFamily:"'Inter Tight', sans-serif", fontSize:'16px', fontWeight:600, color:'var(--text-primary)', marginBottom:2 },
  taskName: { fontSize:'13px', color:'var(--text-tertiary)' },
  closeBtn: { border:'none', background:'none', color:'var(--text-tertiary)', padding:'4px', borderRadius:'var(--radius-sm)', display:'flex', alignItems:'center', cursor:'pointer', flexShrink:0 },
  body: { padding:'1.25rem 1.5rem' },
  textarea: { width:'100%', minHeight:140, padding:'10px 12px', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', background:'var(--surface)', color:'var(--text-primary)', fontSize:'14px', lineHeight:1.6, resize:'vertical', outline:'none', fontFamily:'inherit' },
  footer: { display:'flex', justifyContent:'flex-end', gap:'8px', padding:'1rem 1.5rem', borderTop:'1px solid var(--border)' },
  cancelBtn: { padding:'8px 16px', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', background:'none', color:'var(--text-secondary)', cursor:'pointer', fontSize:'13px' },
  saveBtn: { padding:'8px 20px', border:'none', borderRadius:'var(--radius-sm)', background:'var(--accent)', color:'#fff', fontWeight:500, cursor:'pointer', fontSize:'13px' },
};
