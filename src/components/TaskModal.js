import React, { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';

const PRIORITIES = ['high', 'medium', 'low'];
const STATUSES = ['Open', 'In progress', 'Done', 'Stuck'];

export default function TaskModal({ task, categories, onSave, onClose }) {
  const [form, setForm] = useState(task);
  const nameRef = useRef();

  useEffect(() => {
    nameRef.current?.focus();
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const set = (field, value) => {
    const today = new Date().toISOString().split('T')[0];
    setForm(f => ({ ...f, [field]: value, lastUpdate: today }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) { nameRef.current?.focus(); return; }
    onSave(form);
  };

  return (
    <div style={styles.overlay} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={styles.modal} role="dialog" aria-modal="true" aria-label="Task details">
        <div style={styles.modalHeader}>
          <h2 style={styles.modalTitle}>{task.name ? 'Edit task' : 'New task'}</h2>
          <button style={styles.closeBtn} onClick={onClose} aria-label="Close"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={styles.body}>
            <div style={styles.field}>
              <label style={styles.label}>Task name <span style={styles.required}>*</span></label>
              <input ref={nameRef} type="text" value={form.name} onChange={e => set('name', e.target.value)} placeholder="What needs to be done?" />
            </div>

            <div style={styles.row2}>
              <div style={styles.field}>
                <label style={styles.label}>Owner</label>
                <input type="text" value={form.owner} onChange={e => set('owner', e.target.value)} placeholder="Assign to…" />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Category</label>
                <select value={form.categoryId || ''} onChange={e => set('categoryId', e.target.value)}>
                  <option value="">No category</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>

            <div style={styles.row2}>
              <div style={styles.field}>
                <label style={styles.label}>Priority</label>
                <select value={form.priority} onChange={e => set('priority', e.target.value)}>
                  {PRIORITIES.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
                </select>
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Status</label>
                <select value={form.status || 'Open'} onChange={e => set('status', e.target.value)}>
                  {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Due date</label>
              <input type="date" value={form.dueDate} onChange={e => set('dueDate', e.target.value)} />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Notes</label>
              <textarea value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Any additional context…" />
            </div>
          </div>

          <div style={styles.footer}>
            <button type="button" style={styles.cancelBtn} onClick={onClose}>Cancel</button>
            <button type="submit" style={styles.saveBtn}>Save task</button>
          </div>
        </form>
      </div>
    </div>
  );
}

const styles = {
  overlay: { position:'fixed', inset:0, background:'rgba(0,0,0,0.35)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100, padding:'1rem' },
  modal: { background:'var(--surface)', borderRadius:'var(--radius-lg)', width:'100%', maxWidth:'540px', boxShadow:'var(--shadow-md)', overflow:'hidden' },
  modalHeader: { display:'flex', alignItems:'center', justifyContent:'space-between', padding:'1.25rem 1.5rem 1rem', borderBottom:'1px solid var(--border)' },
  modalTitle: { fontFamily:"'Inter Tight', sans-serif", fontSize:'16px', fontWeight:600, color:'var(--text-primary)' },
  closeBtn: { border:'none', background:'none', color:'var(--text-tertiary)', padding:'4px', borderRadius:'var(--radius-sm)', display:'flex', alignItems:'center' },
  body: { padding:'1.25rem 1.5rem', display:'flex', flexDirection:'column', gap:'1rem' },
  row2: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' },
  field: { display:'flex', flexDirection:'column', gap:'5px' },
  label: { fontSize:'12px', fontWeight:500, color:'var(--text-secondary)', textTransform:'uppercase', letterSpacing:'0.04em' },
  required: { color:'#DC2626' },
  footer: { display:'flex', justifyContent:'flex-end', gap:'8px', padding:'1rem 1.5rem', borderTop:'1px solid var(--border)' },
  cancelBtn: { padding:'8px 16px', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', background:'none', color:'var(--text-secondary)', cursor:'pointer' },
  saveBtn: { padding:'8px 20px', border:'none', borderRadius:'var(--radius-sm)', background:'var(--accent)', color:'#fff', fontWeight:500, cursor:'pointer' },
};
