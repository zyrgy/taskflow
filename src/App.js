import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Plus, Search, CheckCircle2, Trash2, Pencil, SlidersHorizontal, Tag, ChevronDown, ChevronRight, Loader, LogOut, ChevronsUpDown, ChevronUp, Columns, CalendarDays } from 'lucide-react';
import { fetchTasks, fetchCategories, createTask, updateTask, deleteTask as dbDeleteTask, replaceCategories, getSession, signOut, supabase } from './lib/supabase';
import TaskModal from './components/TaskModal';
import CategoryManager from './components/CategoryManager';
import ImportModal from './components/ImportModal';
import LoginPage from './components/LoginPage';
import PriorityBadge from './components/PriorityBadge';
import './App.css';

const PRIORITIES_ORDER = { high: 0, medium: 1, low: 2 };

function formatDate(str) {
  if (!str) return '—';
  const [y, m, d] = str.split('-');
  return `${d}/${m}/${y}`;
}

function isOverdue(dueDate, done) {
  if (done || !dueDate) return false;
  return new Date(dueDate) < new Date(new Date().toDateString());
}

function newTaskTemplate() {
  const today = new Date().toISOString().split('T')[0];
  return { id: crypto.randomUUID(), name: '', owner: '', dueDate: today, priority: 'medium', lastUpdate: today, notes: '', done: false, status: 'Open', categoryId: '' };
}

function CategoryBadge({ categoryId, categories, onSelect }) {
  const [open, setOpen] = useState(false);
  const ref = React.useRef();
  const cat = categories.find(c => c.id === categoryId);

  useEffect(() => {
    if (!open) return;
    const handle = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    window.addEventListener('mousedown', handle);
    return () => window.removeEventListener('mousedown', handle);
  }, [open]);

  const badge = cat
    ? <span className="cat-badge" style={{ background: cat.color + '18', color: cat.color, border: `1px solid ${cat.color}40`, display:'inline-flex', alignItems:'center', gap:4 }}>
        <span style={{ width:6, height:6, borderRadius:'50%', background:cat.color, display:'inline-block', flexShrink:0 }} />
        {cat.name}
        {onSelect && <ChevronDown size={10} />}
      </span>
    : <span className="cell-secondary" style={{ display:'inline-flex', alignItems:'center', gap:4, cursor: onSelect ? 'pointer' : 'default' }}>
        —{onSelect && <ChevronDown size={10} />}
      </span>;

  if (!onSelect) return badge;

  return (
    <span ref={ref} style={{ position:'relative', display:'inline-block' }}>
      <span onClick={() => setOpen(o => !o)} style={{ cursor:'pointer' }}>{badge}</span>
      {open && (
        <div style={{ position:'absolute', top:'calc(100% + 4px)', left:0, background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--radius-md)', boxShadow:'var(--shadow-md)', zIndex:50, minWidth:150, padding:4 }}>
          <div
            onClick={() => { onSelect(''); setOpen(false); }}
            style={{ padding:'6px 10px', borderRadius:'var(--radius-sm)', cursor:'pointer', fontSize:13, color:'var(--text-tertiary)', background: !categoryId ? 'var(--bg)' : 'transparent' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg)'}
            onMouseLeave={e => e.currentTarget.style.background = !categoryId ? 'var(--bg)' : 'transparent'}
          >
            No category
          </div>
          {categories.map(c => (
            <div
              key={c.id}
              onClick={() => { onSelect(c.id); setOpen(false); }}
              style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 10px', borderRadius:'var(--radius-sm)', cursor:'pointer', background: c.id === categoryId ? 'var(--bg)' : 'transparent' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg)'}
              onMouseLeave={e => e.currentTarget.style.background = c.id === categoryId ? 'var(--bg)' : 'transparent'}
            >
              <span style={{ width:10, height:10, borderRadius:'50%', background:c.color, flexShrink:0 }} />
              <span style={{ fontSize:13, color:'var(--text-primary)' }}>{c.name}</span>
            </div>
          ))}
        </div>
      )}
    </span>
  );
}

const ALL_COLUMNS = [
  { key: 'name',       label: 'Task',         sortable: true  },
  { key: 'owner',      label: 'Owner',        sortable: true  },
  { key: 'category',   label: 'Category',     sortable: true  },
  { key: 'status',     label: 'Status',       sortable: true  },
  { key: 'dueDate',    label: 'Due date',     sortable: true  },
  { key: 'priority',   label: 'Priority',     sortable: true  },
  { key: 'lastUpdate', label: 'Last updated', sortable: true  },
  { key: 'notes',      label: 'Notes',        sortable: false },
];

const DEFAULT_COL_WIDTHS = { name: 220, owner: 130, category: 120, status: 110, dueDate: 110, priority: 100, lastUpdate: 120, notes: 80 };

const STATUS_CONFIG = {
  'Open':        { bg: '#F1F5F9', color: '#475569', border: '#CBD5E1' },
  'In progress': { bg: '#EFF6FF', color: '#1D4ED8', border: '#BFDBFE' },
  'Done':        { bg: '#F0FDF4', color: '#166534', border: '#BBF7D0' },
  'Stuck':       { bg: '#FEF2F2', color: '#991B1B', border: '#FECACA' },
};

function StatusBadge({ status, onSelect }) {
  const [open, setOpen] = useState(false);
  const ref = React.useRef();
  const c = STATUS_CONFIG[status] || STATUS_CONFIG['Open'];

  useEffect(() => {
    if (!open) return;
    const handle = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    window.addEventListener('mousedown', handle);
    return () => window.removeEventListener('mousedown', handle);
  }, [open]);

  return (
    <span ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <span
        onClick={() => setOpen(o => !o)}
        style={{ display:'inline-flex', alignItems:'center', padding:'2px 8px', borderRadius:20, fontSize:12, fontWeight:500, background:c.bg, color:c.color, border:`1px solid ${c.border}`, cursor:'pointer', whiteSpace:'nowrap', gap: 4 }}
      >
        {status || 'Open'}
        <ChevronDown size={10} />
      </span>
      {open && (
        <div style={{ position:'absolute', top:'calc(100% + 4px)', left:0, background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--radius-md)', boxShadow:'var(--shadow-md)', zIndex:50, minWidth:130, padding:4 }}>
          {STATUS_CYCLE.map(s => {
            const sc = STATUS_CONFIG[s];
            return (
              <div
                key={s}
                onClick={() => { onSelect(s); setOpen(false); }}
                style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 10px', borderRadius:'var(--radius-sm)', cursor:'pointer', background: s === status ? 'var(--bg)' : 'transparent' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg)'}
                onMouseLeave={e => e.currentTarget.style.background = s === status ? 'var(--bg)' : 'transparent'}
              >
                <span style={{ display:'inline-flex', alignItems:'center', padding:'1px 8px', borderRadius:20, fontSize:12, fontWeight:500, background:sc.bg, color:sc.color, border:`1px solid ${sc.border}` }}>{s}</span>
              </div>
            );
          })}
        </div>
      )}
    </span>
  );
}

function SortIcon({ col, sortKey, sortDir }) {
  if (sortKey !== col) return <ChevronsUpDown size={12} style={{ opacity: 0.3, marginLeft: 4 }} />;
  return sortDir === 'asc'
    ? <ChevronUp size={12} style={{ marginLeft: 4, color: 'var(--accent)' }} />
    : <ChevronDown size={12} style={{ marginLeft: 4, color: 'var(--accent)' }} />;
}

function TaskTable({ tasks, onStatusCycle, onPriorityChange, onCategoryChange, onDueDateChange, onEdit, onDelete, categories, showCategory, sortKey, sortDir, onSort, visibleCols, colWidths, onColResize }) {
  if (tasks.length === 0) return null;
  const cols = ALL_COLUMNS.filter(c => c.key !== 'category' || showCategory).filter(c => visibleCols.includes(c.key));

  const startResize = (e, colKey) => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startWidth = colWidths[colKey] || DEFAULT_COL_WIDTHS[colKey] || 120;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    const onMove = (me) => {
      const newWidth = Math.max(60, startWidth + me.clientX - startX);
      onColResize(colKey, newWidth);
    };
    const onUp = () => {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  return (
    <table className="table" style={{ tableLayout: 'fixed' }}>
      <thead>
        <tr>
          {cols.map(col => (
            <th key={col.key}
              style={{ width: colWidths[col.key] || DEFAULT_COL_WIDTHS[col.key] || 120, position: 'relative', userSelect: 'none' }}
              onClick={col.sortable ? () => onSort(col.key) : undefined}>
              <span style={{ display: 'inline-flex', alignItems: 'center', cursor: col.sortable ? 'pointer' : 'default' }}>
                {col.label}
                {col.sortable && <SortIcon col={col.key} sortKey={sortKey} sortDir={sortDir} />}
              </span>
              <span
                className="col-resize-handle"
                onMouseDown={e => startResize(e, col.key)}
                onClick={e => e.stopPropagation()}
                title="Drag to resize"
              />
            </th>
          ))}
          <th style={{ width: 80 }}></th>
        </tr>
      </thead>
      <tbody>
        {tasks.map(task => (
          <tr key={task.id} className={`task-row ${task.status === 'Done' ? 'row-done' : ''}`}>
            {cols.map(col => {
              if (col.key === 'name') return (
                <td key="name" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}><span className={`task-name ${task.status === 'Done' ? 'task-name-done' : ''}`}>{task.name || '—'}</span></td>
              );
              if (col.key === 'owner') return <td key="owner" className="cell-secondary" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.owner || '—'}</td>;
              if (col.key === 'category') return <td key="category"><CategoryBadge categoryId={task.categoryId} categories={categories} onSelect={(id) => onCategoryChange(task, id)} /></td>;
              if (col.key === 'status') return (
                <td key="status">
                  <StatusBadge status={task.status} onSelect={(s) => onStatusCycle(task, s)} />
                </td>
              );
              if (col.key === 'dueDate') return (
                <td key="dueDate" className={isOverdue(task.dueDate, task.status === 'Done') ? 'cell-overdue' : 'cell-secondary'}>
                  <span style={{ display:'inline-flex', alignItems:'center', gap:6 }}>
                    {formatDate(task.dueDate)}
                    <span style={{ position:'relative', display:'inline-flex', alignItems:'center' }}>
                      <CalendarDays
                        size={13}
                        style={{ cursor:'pointer', color:'var(--text-tertiary)' }}
                        onClick={e => { const inp = e.currentTarget.nextSibling; try { inp.showPicker(); } catch { inp.click(); } }}
                      />
                      <input
                        type="date"
                        value={task.dueDate || ''}
                        onChange={e => onDueDateChange(task, e.target.value)}
                        style={{ position:'absolute', opacity:0, width:1, height:1, top:0, left:0, pointerEvents:'none' }}
                      />
                    </span>
                  </span>
                </td>
              );
              if (col.key === 'priority') return <td key="priority"><PriorityBadge priority={task.priority} onSelect={(p) => onPriorityChange(task, p)} /></td>;
              if (col.key === 'lastUpdate') return <td key="lastUpdate" className="cell-secondary">{formatDate(task.lastUpdate)}</td>;
              if (col.key === 'notes') return (
                <td key="notes">
                  {task.notes
                    ? <span className="notes-tooltip-wrap"><span className="task-note-hint">Note</span><span className="notes-tooltip">{task.notes}</span></span>
                    : <span className="cell-secondary">—</span>}
                </td>
              );
              return null;
            })}
            <td>
              <div className="row-actions">
                <button className="action-btn" onClick={() => onEdit(task)} aria-label="Edit task"><Pencil size={14} /></button>
                <button className="action-btn action-delete" onClick={() => onDelete(task.id)} aria-label="Delete task"><Trash2 size={14} /></button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function CollapsibleGroup({ id, group, onStatusCycle, onPriorityChange, onCategoryChange, onDueDateChange, onEdit, onDelete, categories, sortKey, sortDir, onSort, visibleCols, colWidths, onColResize }) {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <div className="group-section">
      <button className="group-header" onClick={() => setCollapsed(c => !c)} aria-expanded={!collapsed}>
        <span className="group-chevron">{collapsed ? <ChevronRight size={15} /> : <ChevronDown size={15} />}</span>
        <span className="group-dot" style={{ background: group.color }} />
        <span className="group-label">{group.label}</span>
        <span className="group-count">{group.tasks.length}</span>
      </button>
      {!collapsed && (
        <div className="table-wrap">
          <TaskTable tasks={group.tasks} onStatusCycle={onStatusCycle} onPriorityChange={onPriorityChange} onCategoryChange={onCategoryChange} onDueDateChange={onDueDateChange} onEdit={onEdit} onDelete={onDelete} categories={categories} showCategory={false} sortKey={sortKey} sortDir={sortDir} onSort={onSort} visibleCols={visibleCols} colWidths={colWidths} onColResize={onColResize} />
        </div>
      )}
    </div>
  );
}

const STATUS_CYCLE = ['Open', 'In progress', 'Done', 'Stuck'];

export default function App() {
  const [session, setSession] = useState(undefined); // undefined = loading, null = logged out
  const [tasks, setTasks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [groupByCategory, setGroupByCategory] = useState(false);
  const [modalTask, setModalTask] = useState(null);
  const [showCatManager, setShowCatManager] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sortKey, setSortKey] = useState('name');
  const [sortDir, setSortDir] = useState('asc');
  const [visibleCols, setVisibleCols] = useState(['name','owner','category','status','dueDate','priority','lastUpdate','notes']);
  const [showColPicker, setShowColPicker] = useState(false);
  const [colWidths, setColWidths] = useState({});

  const handleColResize = useCallback((key, width) => {
    setColWidths(prev => ({ ...prev, [key]: width }));
  }, []);

  const dataLoaded = React.useRef(false);

  useEffect(() => {
    getSession().then(s => setSession(s || null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, s) => {
      if (event === 'SIGNED_OUT') {
        setSession(null);
        dataLoaded.current = false;
      } else if (event === 'SIGNED_IN' && !dataLoaded.current) {
        setSession(s || null);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session || dataLoaded.current) return;
    dataLoaded.current = true;
    setLoading(true);
    async function load() {
      try {
        const { data } = await supabase.from('allowed_users').select('email').eq('email', session.user.email).single();
        if (!data) { setError('unauthorized'); setLoading(false); return; }
        const [t, c] = await Promise.all([fetchTasks(), fetchCategories()]);
        setTasks(t);
        setCategories(c);
      } catch (e) { setError(e.message); }
      finally { setLoading(false); }
    }
    load();
  }, [session]);

  const handleSort = useCallback((key) => {
    setSortKey(prev => {
      if (prev === key) { setSortDir(d => d === 'asc' ? 'desc' : 'asc'); return key; }
      setSortDir('asc'); return key;
    });
  }, []);

  const handleStatusCycle = useCallback(async (task, newStatus) => {
    const today = new Date().toISOString().split('T')[0];
    const updated = { ...task, status: newStatus, lastUpdate: today };
    setTasks(prev => prev.map(t => t.id === task.id ? updated : t));
    try { await updateTask(updated); }
    catch (e) { setTasks(prev => prev.map(t => t.id === task.id ? task : t)); }
  }, []);

  const handlePriorityChange = useCallback(async (task, newPriority) => {
    const today = new Date().toISOString().split('T')[0];
    const updated = { ...task, priority: newPriority, lastUpdate: today };
    setTasks(prev => prev.map(t => t.id === task.id ? updated : t));
    try { await updateTask(updated); }
    catch (e) { setTasks(prev => prev.map(t => t.id === task.id ? task : t)); }
  }, []);

  const handleCategoryChange = useCallback(async (task, newCategoryId) => {
    const today = new Date().toISOString().split('T')[0];
    const updated = { ...task, categoryId: newCategoryId, lastUpdate: today };
    setTasks(prev => prev.map(t => t.id === task.id ? updated : t));
    try { await updateTask(updated); }
    catch (e) { setTasks(prev => prev.map(t => t.id === task.id ? task : t)); }
  }, []);

  const handleDueDateChange = useCallback(async (task, newDate) => {
    const today = new Date().toISOString().split('T')[0];
    const updated = { ...task, dueDate: newDate, lastUpdate: today };
    setTasks(prev => prev.map(t => t.id === task.id ? updated : t));
    try { await updateTask(updated); }
    catch (e) { setTasks(prev => prev.map(t => t.id === task.id ? task : t)); }
  }, []);

  const openNew = () => setModalTask(newTaskTemplate());
  const openEdit = (task) => setModalTask({ ...task });

  const handleSave = useCallback(async (saved) => {
    setSaving(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const taskToSave = { ...saved, lastUpdate: today };
      const isNew = !tasks.find(t => t.id === saved.id);
      const result = isNew ? await createTask(taskToSave) : await updateTask(taskToSave);
      setTasks(prev => isNew ? [result, ...prev] : prev.map(t => t.id === result.id ? result : t));
      setModalTask(null);
    } catch (e) { alert('Failed to save: ' + e.message); }
    finally { setSaving(false); }
  }, [tasks]);

  const handleDelete = useCallback(async (id) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    try { await dbDeleteTask(id); }
    catch (e) { alert('Failed to delete: ' + e.message); }
  }, []);

  const handleSaveCategories = useCallback(async (incoming) => {
    setSaving(true);
    try {
      const final = await replaceCategories(incoming, categories);
      setCategories(final);
      const removedIds = categories.filter(c => !final.find(f => f.id === c.id)).map(c => c.id);
      if (removedIds.length) setTasks(prev => prev.map(t => removedIds.includes(t.categoryId) ? { ...t, categoryId: '' } : t));
      setShowCatManager(false);
    } catch (e) { alert('Failed to save categories: ' + e.message); }
    finally { setSaving(false); }
  }, [categories]);

  const filtered = useMemo(() => {
    const getCatName = (t) => categories.find(c => c.id === t.categoryId)?.name || '';
    return tasks
      .filter(t => {
        if (filter === 'To do' && t.status !== 'Open') return false;
        if (filter === 'Done' && t.status !== 'Done') return false;
        if (filter === 'In progress' && t.status !== 'In progress') return false;
        if (filter === 'Stuck' && t.status !== 'Stuck') return false;
        if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;
        if (categoryFilter !== 'all' && t.categoryId !== categoryFilter) return false;
        if (search) {
          const q = search.toLowerCase();
          return t.name.toLowerCase().includes(q) || t.owner.toLowerCase().includes(q);
        }
        return true;
      })
      .sort((a, b) => {
        if (sortKey) {
          let aVal, bVal;
          if (sortKey === 'priority') { aVal = PRIORITIES_ORDER[a.priority] ?? 1; bVal = PRIORITIES_ORDER[b.priority] ?? 1; }
          else if (sortKey === 'category') { aVal = getCatName(a).toLowerCase(); bVal = getCatName(b).toLowerCase(); }
          else { aVal = (a[sortKey] || '').toString().toLowerCase(); bVal = (b[sortKey] || '').toString().toLowerCase(); }
          if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
          if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
          return 0;
        }
        return (PRIORITIES_ORDER[a.priority] ?? 1) - (PRIORITIES_ORDER[b.priority] ?? 1);
      });
  }, [tasks, filter, search, priorityFilter, categoryFilter, sortKey, sortDir, categories]);

  const doneCount = tasks.filter(t => t.status === 'Done').length;
  const totalCount = tasks.length;

  const groups = useMemo(() => {
    if (!groupByCategory) return null;
    const map = new Map();
    map.set('', { label: 'Uncategorized', color: '#A09D94', tasks: [] });
    categories.forEach(c => map.set(c.id, { label: c.name, color: c.color, tasks: [] }));
    filtered.forEach(t => {
      const key = (t.categoryId && map.has(t.categoryId)) ? t.categoryId : '';
      map.get(key).tasks.push(t);
    });
    return [...map.entries()].filter(([, g]) => g.tasks.length > 0);
  }, [filtered, categories, groupByCategory]);

  const handleImport = useCallback(async (importedTasks) => {
    setSaving(true);
    try {
      const created = await Promise.all(importedTasks.map(t => createTask(t)));
      setTasks(prev => [...prev, ...created]);
      setShowImport(false);
    } catch (e) { alert('Import failed: ' + e.message); }
    finally { setSaving(false); }
  }, []);

  const handleSignOut = async () => { await signOut(); setSession(null); setTasks([]); setCategories([]); };

  if (session === undefined) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: 10, color: 'var(--text-tertiary)' }}>
      <Loader size={20} className="spin" /> Loading…
    </div>
  );

  if (!session) return <LoginPage />;

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: 10, color: 'var(--text-tertiary)' }}>
      <Loader size={20} className="spin" /> Loading tasks…
    </div>
  );

  if (error === 'unauthorized') return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', padding: '1rem' }}>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '2.5rem 2rem', width: '100%', maxWidth: '360px', textAlign: 'center', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--high-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
          <LogOut size={20} color="var(--high-text)" />
        </div>
        <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>Access denied</h2>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
          Your account ({session?.user?.email}) is not authorized to access this app. Contact the admin to request access.
        </p>
        <button onClick={handleSignOut} style={{ padding: '8px 20px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', background: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 14 }}>
          Sign out
        </button>
      </div>
    </div>
  );

  if (error) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column', gap: 10, color: '#DC2626' }}>
      <p style={{ fontWeight: 500 }}>Could not connect to database</p>
      <p style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>{error}</p>
    </div>
  );

  return (
    <div className="layout">
      <header className="header">
        <div className="header-inner">
          <div className="brand">
            <img src="/logo.png" alt="Ladies Tasks" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
            <h1 className="brand-name">Ladies Tasks</h1>
          </div>
          <div className="header-meta">
            {saving && <Loader size={14} className="spin" style={{ color: 'var(--text-tertiary)' }} />}
            <span className="progress-text">{doneCount} / {totalCount} done</span>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: totalCount ? `${(doneCount / totalCount) * 100}%` : '0%' }} />
            </div>
            <button onClick={handleSignOut} style={{ border: 'none', background: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, marginLeft: 8 }} title="Sign out">
              <LogOut size={15} /> Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="main">
        <div className="toolbar">
          <div className="search-wrap">
            <Search size={15} className="search-icon" style={{ left: 12 }} />
            <input className="search-input" type="text" placeholder="Search tasks or owners…" value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 40 }} />
          </div>
          <div className="toolbar-right">
            <button className={`filter-toggle ${groupByCategory ? 'active' : ''}`} onClick={() => setGroupByCategory(g => !g)}>
              <Tag size={15} /> Group
            </button>
            <button className={`filter-toggle ${showFilters ? 'active' : ''}`} onClick={() => setShowFilters(s => !s)}>
              <SlidersHorizontal size={15} /> Filters
            </button>
            <div style={{ position: 'relative' }}>
              <button className={`filter-toggle ${showColPicker ? 'active' : ''}`} onClick={() => setShowColPicker(s => !s)}>
                <Columns size={15} /> Columns
              </button>
              {showColPicker && (
                <div className="col-picker">
                  {ALL_COLUMNS.map(col => (
                    <label key={col.key} className="col-picker-item">
                      <input
                        type="checkbox"
                        checked={visibleCols.includes(col.key)}
                        onChange={() => {
                          setVisibleCols(prev =>
                            prev.includes(col.key)
                              ? prev.length > 1 ? prev.filter(k => k !== col.key) : prev
                              : [...prev, col.key]
                          );
                        }}
                      />
                      {col.label}
                    </label>
                  ))}
                </div>
              )}
            </div>
            <button className="btn-secondary" onClick={() => setShowImport(true)}>Import</button>
            <button className="btn-secondary" onClick={() => setShowCatManager(true)}>Categories</button>
            <button className="btn-primary" onClick={openNew}><Plus size={15} /> New task</button>
          </div>
        </div>

        {showFilters && (
          <div className="filter-bar">
            <div className="filter-group">
              <span className="filter-label">Status</span>
              {['All', 'Open', 'In progress', 'Done', 'Stuck'].map(f => (
                <button key={f} className={`chip ${filter === f ? 'chip-active' : ''}`} onClick={() => setFilter(f)}>{f}</button>
              ))}
            </div>
            <div className="filter-group">
              <span className="filter-label">Priority</span>
              {['all', 'high', 'medium', 'low'].map(p => (
                <button key={p} className={`chip ${priorityFilter === p ? 'chip-active' : ''}`} onClick={() => setPriorityFilter(p)}>
                  {p === 'all' ? 'All' : p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>
            <div className="filter-group">
              <span className="filter-label">Category</span>
              <button className={`chip ${categoryFilter === 'all' ? 'chip-active' : ''}`} onClick={() => setCategoryFilter('all')}>All</button>
              {categories.map(c => (
                <button key={c.id} className={`chip ${categoryFilter === c.id ? 'chip-active' : ''}`} onClick={() => setCategoryFilter(c.id)}>
                  <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: c.color, marginRight: 5, verticalAlign: 'middle' }} />
                  {c.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {groupByCategory ? (
          <div className="groups">
            {groups && groups.length === 0 && (
              <div className="empty-state-standalone">
                <CheckCircle2 size={28} strokeWidth={1.5} />
                <p>No tasks match your filters</p>
                <button className="btn-ghost" onClick={openNew}>Add one now</button>
              </div>
            )}
            {groups && groups.map(([id, group]) => (
              <CollapsibleGroup key={id} id={id} group={group} onStatusCycle={handleStatusCycle} onPriorityChange={handlePriorityChange} onCategoryChange={handleCategoryChange} onDueDateChange={handleDueDateChange} onEdit={openEdit} onDelete={handleDelete} categories={categories} sortKey={sortKey} sortDir={sortDir} onSort={handleSort} visibleCols={visibleCols} colWidths={colWidths} onColResize={handleColResize} />
            ))}
          </div>
        ) : (
          <div className="table-wrap">
            {filtered.length === 0 ? (
              <div className="empty-state-standalone">
                <CheckCircle2 size={28} strokeWidth={1.5} />
                <p>No tasks match your filters</p>
                <button className="btn-ghost" onClick={openNew}>Add one now</button>
              </div>
            ) : (
              <TaskTable tasks={filtered} onStatusCycle={handleStatusCycle} onPriorityChange={handlePriorityChange} onCategoryChange={handleCategoryChange} onDueDateChange={handleDueDateChange} onEdit={openEdit} onDelete={handleDelete} categories={categories} showCategory={true} sortKey={sortKey} sortDir={sortDir} onSort={handleSort} visibleCols={visibleCols} colWidths={colWidths} onColResize={handleColResize} />
            )}
          </div>
        )}
      </main>

      {showImport && <ImportModal categories={categories} onImport={handleImport} onClose={() => setShowImport(false)} />}
      {modalTask && <TaskModal task={modalTask} categories={categories} onSave={handleSave} onClose={() => setModalTask(null)} />}
      {showCatManager && <CategoryManager categories={categories} onSave={handleSaveCategories} onClose={() => setShowCatManager(false)} />}
    </div>
  );
}
