import React, { useState, useRef } from 'react';
import { X, Upload, AlertCircle, CheckCircle2 } from 'lucide-react';
import * as XLSX from 'xlsx';

const PRIORITY_MAP = {
  'high': 'high', 'גבוה': 'high',
  'medium': 'medium', 'med': 'medium', 'בינוני': 'medium', 'medium': 'medium',
  'low': 'low', 'נמוך': 'low',
};

function normalizeDate(val) {
  if (!val) return '';
  // Excel serial number
  if (typeof val === 'number') {
    const date = XLSX.SSF.parse_date_code(val);
    if (date) {
      const m = String(date.m).padStart(2, '0');
      const d = String(date.d).padStart(2, '0');
      return `${date.y}-${m}-${d}`;
    }
  }
  // String date — try to parse
  const str = String(val).trim();
  if (!str) return '';
  // Already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
  // DD/MM/YYYY
  const dmyMatch = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (dmyMatch) return `${dmyMatch[3]}-${dmyMatch[2].padStart(2,'0')}-${dmyMatch[1].padStart(2,'0')}`;
  // MM/DD/YYYY
  const mdyMatch = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (mdyMatch) return `${mdyMatch[3]}-${mdyMatch[1].padStart(2,'0')}-${mdyMatch[2].padStart(2,'0')}`;
  const d = new Date(str);
  if (!isNaN(d)) return d.toISOString().split('T')[0];
  return '';
}

function parseRows(sheet) {
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
  const today = new Date().toISOString().split('T')[0];
  const tasks = [];
  const errors = [];

  rows.forEach((row, i) => {
    // Normalize keys to lowercase
    const r = Object.fromEntries(Object.entries(row).map(([k, v]) => [k.toLowerCase().trim(), v]));
    const name = (r['task name'] || r['name'] || r['task'] || '').toString().trim();
    if (!name) { errors.push(`Row ${i + 2}: missing task name`); return; }

    const priority = PRIORITY_MAP[(r['priority'] || '').toString().toLowerCase().trim()] || 'medium';
    tasks.push({
      id: crypto.randomUUID(),
      name,
      owner: (r['owner'] || r['assigned to'] || '').toString().trim(),
      dueDate: normalizeDate(r['due date'] || r['duedate'] || r['due'] || ''),
      priority,
      lastUpdate: normalizeDate(r['last update'] || r['last updated'] || r['lastupdate'] || '') || today,
      notes: (r['notes'] || r['note'] || '').toString().trim(),
      done: false,
      categoryId: '',
      createdAt: Date.now(),
    });
  });

  return { tasks, errors };
}

export default function ImportModal({ categories, onImport, onClose }) {
  const [preview, setPreview] = useState(null);
  const [errors, setErrors] = useState([]);
  const [fileName, setFileName] = useState('');
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef();

  const processFile = (file) => {
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target.result, { type: 'array' });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const { tasks, errors } = parseRows(sheet);
        setPreview(tasks);
        setErrors(errors);
      } catch (err) {
        setErrors([`Could not read file: ${err.message}`]);
        setPreview(null);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    processFile(e.dataTransfer.files[0]);
  };

  return (
    <div style={styles.overlay} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <h2 style={styles.title}>Import from Excel</h2>
          <button style={styles.closeBtn} onClick={onClose}><X size={18} /></button>
        </div>

        <div style={styles.body}>
          {!preview ? (
            <>
              <div
                style={{ ...styles.dropzone, ...(dragging ? styles.dropzoneDragging : {}) }}
                onDragOver={e => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                onClick={() => inputRef.current.click()}
              >
                <Upload size={24} color="var(--text-tertiary)" />
                <p style={styles.dropText}>Drop your Excel file here or <span style={styles.dropLink}>browse</span></p>
                <p style={styles.dropHint}>.xlsx or .xls files</p>
                <input ref={inputRef} type="file" accept=".xlsx,.xls" style={{ display: 'none' }} onChange={e => processFile(e.target.files[0])} />
              </div>

              <div style={styles.hint}>
                <p style={styles.hintTitle}>Expected columns:</p>
                <p style={styles.hintText}>Task Name, Owner, Due Date, Priority (high/medium/low), Last Update, Notes</p>
              </div>
            </>
          ) : (
            <>
              <div style={styles.summary}>
                <CheckCircle2 size={16} color="var(--low-text)" />
                <span style={{ fontSize: 14 }}><strong>{preview.length}</strong> tasks ready to import from <em>{fileName}</em></span>
              </div>

              {errors.length > 0 && (
                <div style={styles.errors}>
                  <AlertCircle size={14} color="var(--high-text)" />
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--high-text)' }}>{errors.length} rows skipped:</p>
                    {errors.map((e, i) => <p key={i} style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{e}</p>)}
                  </div>
                </div>
              )}

              <div style={styles.previewWrap}>
                <table style={styles.previewTable}>
                  <thead>
                    <tr>{['Task', 'Owner', 'Due date', 'Priority'].map(h => <th key={h} style={styles.th}>{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {preview.slice(0, 5).map((t, i) => (
                      <tr key={i}>
                        <td style={styles.td}>{t.name}</td>
                        <td style={styles.td}>{t.owner || '—'}</td>
                        <td style={styles.td}>{t.dueDate || '—'}</td>
                        <td style={styles.td}>{t.priority}</td>
                      </tr>
                    ))}
                    {preview.length > 5 && <tr><td colSpan={4} style={{ ...styles.td, color: 'var(--text-tertiary)', textAlign: 'center' }}>…and {preview.length - 5} more</td></tr>}
                  </tbody>
                </table>
              </div>

              <button style={styles.resetBtn} onClick={() => { setPreview(null); setErrors([]); setFileName(''); }}>
                Choose a different file
              </button>
            </>
          )}
        </div>

        <div style={styles.footer}>
          <button style={styles.cancelBtn} onClick={onClose}>Cancel</button>
          {preview && (
            <button style={styles.importBtn} onClick={() => onImport(preview)}>
              Import {preview.length} tasks
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' },
  modal: { background: 'var(--surface)', borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: '520px', boxShadow: 'var(--shadow-md)', overflow: 'hidden' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem 1.5rem 1rem', borderBottom: '1px solid var(--border)' },
  title: { fontFamily: "'Inter Tight', sans-serif", fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' },
  closeBtn: { border: 'none', background: 'none', color: 'var(--text-tertiary)', padding: '4px', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', cursor: 'pointer' },
  body: { padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' },
  dropzone: { border: '2px dashed var(--border)', borderRadius: 'var(--radius-md)', padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', cursor: 'pointer', transition: 'border-color 0.15s' },
  dropzoneDragging: { borderColor: 'var(--accent)', background: 'var(--accent-light)' },
  dropText: { fontSize: '14px', color: 'var(--text-secondary)' },
  dropLink: { color: 'var(--accent)', fontWeight: 500 },
  dropHint: { fontSize: '12px', color: 'var(--text-tertiary)' },
  hint: { background: 'var(--bg)', borderRadius: 'var(--radius-sm)', padding: '10px 12px' },
  hintTitle: { fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 4 },
  hintText: { fontSize: '12px', color: 'var(--text-tertiary)' },
  summary: { display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', background: 'var(--low-bg)', border: '1px solid var(--low-border)', borderRadius: 'var(--radius-sm)' },
  errors: { display: 'flex', gap: 8, padding: '10px 12px', background: 'var(--high-bg)', border: '1px solid var(--high-border)', borderRadius: 'var(--radius-sm)' },
  previewWrap: { border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' },
  previewTable: { width: '100%', borderCollapse: 'collapse' },
  th: { padding: '8px 10px', textAlign: 'left', fontSize: '11px', fontWeight: 500, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', background: 'var(--bg)', borderBottom: '1px solid var(--border)' },
  td: { padding: '8px 10px', fontSize: '13px', color: 'var(--text-primary)', borderBottom: '1px solid var(--border)' },
  resetBtn: { background: 'none', border: 'none', color: 'var(--accent)', fontSize: '13px', cursor: 'pointer', padding: 0, textAlign: 'left' },
  footer: { display: 'flex', justifyContent: 'flex-end', gap: '8px', padding: '1rem 1.5rem', borderTop: '1px solid var(--border)' },
  cancelBtn: { padding: '8px 16px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', background: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '13px' },
  importBtn: { padding: '8px 20px', border: 'none', borderRadius: 'var(--radius-sm)', background: 'var(--accent)', color: '#fff', fontWeight: 500, cursor: 'pointer', fontSize: '13px' },
};
