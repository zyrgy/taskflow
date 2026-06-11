import React, { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';

const PRESET_COLORS = [
  '#7C3AED','#0369A1','#B45309','#047857','#BE185D',
  '#DC2626','#0891B2','#65A30D','#9333EA','#EA580C',
];

export default function CategoryManager({ categories, onSave, onClose }) {
  const [cats, setCats] = useState(categories);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(PRESET_COLORS[0]);
  const [error, setError] = useState('');

  const add = () => {
    const trimmed = newName.trim();
    if (!trimmed) { setError('Enter a category name'); return; }
    if (cats.find(c => c.name.toLowerCase() === trimmed.toLowerCase())) { setError('Name already exists'); return; }
    setCats([...cats, { id: crypto.randomUUID(), name: trimmed, color: newColor }]);
    setNewName('');
    setError('');
  };

  const remove = (id) => setCats(cats.filter(c => c.id !== id));

  return (
    <div style={styles.overlay} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={styles.modal} role="dialog" aria-modal="true">
        <div style={styles.header}>
          <h2 style={styles.title}>Manage categories</h2>
          <button style={styles.closeBtn} onClick={onClose} aria-label="Close"><X size={18} /></button>
        </div>

        <div style={styles.body}>
          <div style={styles.list}>
            {cats.length === 0 && <p style={styles.empty}>No categories yet</p>}
            {cats.map(cat => (
              <div key={cat.id} style={styles.catRow}>
                <span style={{ ...styles.dot, background: cat.color }} />
                <span style={styles.catName}>{cat.name}</span>
                <button style={styles.deleteBtn} onClick={() => remove(cat.id)} aria-label={`Delete ${cat.name}`}>
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>

          <div style={styles.addSection}>
            <p style={styles.addLabel}>New category</p>
            <div style={styles.colorRow}>
              {PRESET_COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => setNewColor(c)}
                  style={{ ...styles.colorSwatch, background: c, outline: newColor === c ? `2px solid ${c}` : 'none', outlineOffset: '2px' }}
                  aria-label={`Select color ${c}`}
                />
              ))}
            </div>
            <div style={styles.addRow}>
              <input
                type="text"
                placeholder="Category name…"
                value={newName}
                onChange={e => { setNewName(e.target.value); setError(''); }}
                onKeyDown={e => e.key === 'Enter' && add()}
                style={styles.input}
                dir="auto"
              />
              <button style={styles.addBtn} onClick={add}><Plus size={15} /> Add</button>
            </div>
            {error && <p style={styles.error}>{error}</p>}
          </div>
        </div>

        <div style={styles.footer}>
          <button style={styles.cancelBtn} onClick={onClose}>Cancel</button>
          <button style={styles.saveBtn} onClick={() => onSave(cats)}>Save changes</button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: { position:'fixed', inset:0, background:'rgba(0,0,0,0.35)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100, padding:'1rem' },
  modal: { background:'var(--surface)', borderRadius:'var(--radius-lg)', width:'100%', maxWidth:'420px', boxShadow:'var(--shadow-md)', overflow:'hidden' },
  header: { display:'flex', alignItems:'center', justifyContent:'space-between', padding:'1.25rem 1.5rem 1rem', borderBottom:'1px solid var(--border)' },
  title: { fontFamily:"'Inter Tight', sans-serif", fontSize:'16px', fontWeight:600, color:'var(--text-primary)' },
  closeBtn: { border:'none', background:'none', color:'var(--text-tertiary)', padding:'4px', borderRadius:'var(--radius-sm)', display:'flex', alignItems:'center' },
  body: { padding:'1.25rem 1.5rem', display:'flex', flexDirection:'column', gap:'1.25rem' },
  list: { display:'flex', flexDirection:'column', gap:'6px', maxHeight:'200px', overflowY:'auto' },
  empty: { fontSize:'13px', color:'var(--text-tertiary)', textAlign:'center', padding:'1rem' },
  catRow: { display:'flex', alignItems:'center', gap:'10px', padding:'8px 10px', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', background:'var(--surface)' },
  dot: { width:'12px', height:'12px', borderRadius:'50%', flexShrink:0 },
  catName: { flex:1, fontSize:'14px', color:'var(--text-primary)' },
  deleteBtn: { border:'none', background:'none', color:'var(--text-tertiary)', padding:'2px', borderRadius:'4px', display:'flex', alignItems:'center', cursor:'pointer' },
  addSection: { display:'flex', flexDirection:'column', gap:'10px' },
  addLabel: { fontSize:'12px', fontWeight:500, color:'var(--text-secondary)', textTransform:'uppercase', letterSpacing:'0.04em' },
  colorRow: { display:'flex', gap:'8px', flexWrap:'wrap' },
  colorSwatch: { width:'22px', height:'22px', borderRadius:'50%', border:'none', cursor:'pointer' },
  addRow: { display:'flex', gap:'8px' },
  input: { flex:1, padding:'8px 12px', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', background:'var(--surface)', color:'var(--text-primary)', fontSize:'14px', outline:'none' },
  addBtn: { display:'flex', alignItems:'center', gap:'4px', padding:'8px 14px', border:'none', borderRadius:'var(--radius-sm)', background:'var(--text-primary)', color:'var(--surface)', fontSize:'13px', fontWeight:500, cursor:'pointer', whiteSpace:'nowrap' },
  error: { fontSize:'12px', color:'#DC2626' },
  footer: { display:'flex', justifyContent:'flex-end', gap:'8px', padding:'1rem 1.5rem', borderTop:'1px solid var(--border)' },
  cancelBtn: { padding:'8px 16px', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', background:'none', color:'var(--text-secondary)', cursor:'pointer', fontSize:'13px' },
  saveBtn: { padding:'8px 20px', border:'none', borderRadius:'var(--radius-sm)', background:'var(--accent)', color:'#fff', fontWeight:500, cursor:'pointer', fontSize:'13px' },
};
