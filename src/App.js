import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Plus, Search, CheckCircle2, Circle, Trash2, Pencil, SlidersHorizontal, Tag, ChevronDown, ChevronRight, Loader, LogOut } from 'lucide-react';
import { fetchTasks, fetchCategories, createTask, updateTask, deleteTask as dbDeleteTask, replaceCategories, rowToTask, getSession, signOut, onAuthStateChange } from './lib/supabase';
import TaskModal from './components/TaskModal';
import CategoryManager from './components/CategoryManager';
import LoginPage from './components/LoginPage';
import PriorityBadge from './components/PriorityBadge';
import './App.css';

const FILTERS = ['All', 'To do', 'Done'];
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
  return { id: crypto.randomUUID(), name: '', owner: '', dueDate: today, priority: 'medium', lastUpdate: today, notes: '', done: false, categoryId: '' };
}

function CategoryBadge({ categoryId, categories }) {
  const cat = categories.find(c => c.id === categoryId);
  if (!cat) return <span className="cell-secondary">—</span>;
  return (
    <span className="cat-badge" style={{ background: cat.color + '18', color: cat.color, border: `1px solid ${cat.color}40` }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: cat.color, display: 'inline-block', marginRight: 5, flexShrink: 0 }} />
      {cat.name}
    </span>
  );
}

function TaskTable({ tasks, onToggle, onEdit, onDelete, categories, showCategory }) {
  if (tasks.length === 0) return null;
  return (
    <table className="table">
      <thead>
        <tr>
          <th style={{ width: 44 }}></th>
          <th>Task</th>
          <th>Owner</th>
          {showCategory && <th>Category</th>}
          <th>Due date</th>
          <th>Priority</th>
          <th>Last updated</th>
          <th>Notes</th>
          <th style={{ width: 80 }}></th>
        </tr>
      </thead>
      <tbody>
        {tasks.map(task => (
          <tr key={task.id} className={`task-row ${task.done ? 'row-done' : ''}`}>
            <td>
              <button className="check-btn" onClick={() => onToggle(task)} aria-label={task.done ? 'Mark incomplete' : 'Mark complete'}>
                {task.done ? <CheckCircle2 size={18} color="var(--accent)" /> : <Circle size={18} color="var(--text-tertiary)" />}
              </button>
            </td>
            <td><span className={`task-name ${task.done ? 'task-name-done' : ''}`}>{task.name || '—'}</span></td>
            <td className="cell-secondary">{task.owner || '—'}</td>
            {showCategory && <td><CategoryBadge categoryId={task.categoryId} categories={categories} /></td>}
            <td className={isOverdue(task.dueDate, task.done) ? 'cell-overdue' : 'cell-secondary'}>
              {formatDate(task.dueDate)}
              {isOverdue(task.dueDate, task.done) && <span className="overdue-tag">Overdue</span>}
            </td>
            <td><PriorityBadge priority={task.priority} /></td>
            <td className="cell-secondary">{formatDate(task.lastUpdate)}</td>
            <td>
              {task.notes
                ? <span className="notes-tooltip-wrap"><span className="task-note-hint">Note</span><span className="notes-tooltip">{task.notes}</span></span>
                : <span className="cell-secondary">—</span>}
            </td>
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

function CollapsibleGroup({ id, group, onToggle, onEdit, onDelete, categories }) {
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
          <TaskTable tasks={group.tasks} onToggle={onToggle} onEdit={onEdit} onDelete={onDelete} categories={categories} showCategory={false} />
        </div>
      )}
    </div>
  );
}

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
  const [showFilters, setShowFilters] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Get initial session
    getSession().then(s => setSession(s || null));
    // Listen for auth changes
    const { data: { subscription } } = onAuthStateChange(s => setSession(s || null));
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) return;
    setLoading(true);
    Promise.all([fetchTasks(), fetchCategories()])
      .then(([t, c]) => { setTasks(t.map(rowToTask)); setCategories(c); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [session]);

  const openNew = () => setModalTask(newTaskTemplate());
  const openEdit = (task) => setModalTask({ ...task });

  const handleSave = useCallback(async (saved) => {
    setSaving(true);
    try {
      const isNew = !tasks.find(t => t.id === saved.id);
      const result = isNew ? await createTask(saved) : await updateTask(saved);
      setTasks(prev => isNew ? [result, ...prev] : prev.map(t => t.id === result.id ? result : t));
      setModalTask(null);
    } catch (e) { alert('Failed to save: ' + e.message); }
    finally { setSaving(false); }
  }, [tasks]);

  const handleToggle = useCallback(async (task) => {
    const today = new Date().toISOString().split('T')[0];
    const updated = { ...task, done: !task.done, lastUpdate: today };
    setTasks(prev => prev.map(t => t.id === task.id ? updated : t));
    try { await updateTask(updated); }
    catch (e) { setTasks(prev => prev.map(t => t.id === task.id ? task : t)); }
  }, []);

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
    return tasks
      .filter(t => {
        if (filter === 'To do' && t.done) return false;
        if (filter === 'Done' && !t.done) return false;
        if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;
        if (categoryFilter !== 'all' && t.categoryId !== categoryFilter) return false;
        if (search) {
          const q = search.toLowerCase();
          return t.name.toLowerCase().includes(q) || t.owner.toLowerCase().includes(q);
        }
        return true;
      })
      .sort((a, b) => {
        if (a.done !== b.done) return a.done ? 1 : -1;
        return (PRIORITIES_ORDER[a.priority] ?? 1) - (PRIORITIES_ORDER[b.priority] ?? 1);
      });
  }, [tasks, filter, search, priorityFilter, categoryFilter]);

  const doneCount = tasks.filter(t => t.done).length;
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
            <span className="brand-mark">TF</span>
            <h1 className="brand-name">TaskFlow</h1>
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
            <Search size={15} className="search-icon" />
            <input className="search-input" type="text" placeholder="Search tasks or owners…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="toolbar-right">
            <button className={`filter-toggle ${groupByCategory ? 'active' : ''}`} onClick={() => setGroupByCategory(g => !g)}>
              <Tag size={15} /> Group
            </button>
            <button className={`filter-toggle ${showFilters ? 'active' : ''}`} onClick={() => setShowFilters(s => !s)}>
              <SlidersHorizontal size={15} /> Filters
            </button>
            <button className="btn-secondary" onClick={() => setShowCatManager(true)}>Categories</button>
            <button className="btn-primary" onClick={openNew}><Plus size={15} /> New task</button>
          </div>
        </div>

        {showFilters && (
          <div className="filter-bar">
            <div className="filter-group">
              <span className="filter-label">Status</span>
              {FILTERS.map(f => <button key={f} className={`chip ${filter === f ? 'chip-active' : ''}`} onClick={() => setFilter(f)}>{f}</button>)}
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
              <CollapsibleGroup key={id} id={id} group={group} onToggle={handleToggle} onEdit={openEdit} onDelete={handleDelete} categories={categories} />
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
              <TaskTable tasks={filtered} onToggle={handleToggle} onEdit={openEdit} onDelete={handleDelete} categories={categories} showCategory={true} />
            )}
          </div>
        )}
      </main>

      {modalTask && <TaskModal task={modalTask} categories={categories} onSave={handleSave} onClose={() => setModalTask(null)} />}
      {showCatManager && <CategoryManager categories={categories} onSave={handleSaveCategories} onClose={() => setShowCatManager(false)} />}
    </div>
  );
}
