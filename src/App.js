import React, { useState, useMemo } from 'react';
import { Plus, Search, CheckCircle2, Circle, Trash2, Pencil, SlidersHorizontal } from 'lucide-react';
import { loadTasks, saveTasks, newTask } from './lib/storage';
import TaskModal from './components/TaskModal';
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

export default function App() {
  const [tasks, setTasksRaw] = useState(loadTasks);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [modalTask, setModalTask] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  const setTasks = (t) => { setTasksRaw(t); saveTasks(t); };

  const openNew = () => setModalTask(newTask());
  const openEdit = (task) => setModalTask({ ...task });

  const handleSave = (saved) => {
    setTasks(tasks.some(t => t.id === saved.id)
      ? tasks.map(t => t.id === saved.id ? saved : t)
      : [saved, ...tasks]
    );
    setModalTask(null);
  };

  const toggleDone = (id) => {
    const today = new Date().toISOString().split('T')[0];
    setTasks(tasks.map(t => t.id === id ? { ...t, done: !t.done, lastUpdate: today } : t));
  };

  const deleteTask = (id) => setTasks(tasks.filter(t => t.id !== id));

  const visible = useMemo(() => {
    return tasks
      .filter(t => {
        if (filter === 'To do' && t.done) return false;
        if (filter === 'Done' && !t.done) return false;
        if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;
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
  }, [tasks, filter, search, priorityFilter]);

  const doneCount = tasks.filter(t => t.done).length;
  const totalCount = tasks.length;

  return (
    <div className="layout">
      <header className="header">
        <div className="header-inner">
          <div className="brand">
            <span className="brand-mark">TF</span>
            <h1 className="brand-name">TaskFlow</h1>
          </div>
          <div className="header-meta">
            <span className="progress-text">{doneCount} / {totalCount} done</span>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: totalCount ? `${(doneCount/totalCount)*100}%` : '0%' }} />
            </div>
          </div>
        </div>
      </header>

      <main className="main">
        <div className="toolbar">
          <div className="search-wrap">
            <Search size={15} className="search-icon" />
            <input
              className="search-input"
              type="text"
              placeholder="Search tasks or owners…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <div className="toolbar-right">
            <button className={`filter-toggle ${showFilters ? 'active' : ''}`} onClick={() => setShowFilters(s => !s)}>
              <SlidersHorizontal size={15} />
              Filters
            </button>
            <button className="btn-primary" onClick={openNew}>
              <Plus size={15} />
              New task
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="filter-bar">
            <div className="filter-group">
              <span className="filter-label">Status</span>
              {FILTERS.map(f => (
                <button key={f} className={`chip ${filter === f ? 'chip-active' : ''}`} onClick={() => setFilter(f)}>{f}</button>
              ))}
            </div>
            <div className="filter-group">
              <span className="filter-label">Priority</span>
              {['all','high','medium','low'].map(p => (
                <button key={p} className={`chip ${priorityFilter === p ? 'chip-active' : ''}`} onClick={() => setPriorityFilter(p)}>
                  {p === 'all' ? 'All' : p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: 36 }}></th>
                <th>Task</th>
                <th>Owner</th>
                <th>Due date</th>
                <th>Priority</th>
                <th>Last updated</th>
                <th>Notes</th>
                <th style={{ width: 72 }}></th>
              </tr>
            </thead>
            <tbody>
              {visible.length === 0 && (
                <tr>
                  <td colSpan={8} className="empty-row">
                    <div className="empty-state">
                      <CheckCircle2 size={28} strokeWidth={1.5} />
                      <p>No tasks match your filters</p>
                      <button className="btn-ghost" onClick={openNew}>Add one now</button>
                    </div>
                  </td>
                </tr>
              )}
              {visible.map(task => (
                <tr key={task.id} className={`task-row ${task.done ? 'row-done' : ''}`}>
                  <td>
                    <button
                      className="check-btn"
                      onClick={() => toggleDone(task.id)}
                      aria-label={task.done ? 'Mark incomplete' : 'Mark complete'}
                    >
                      {task.done
                        ? <CheckCircle2 size={18} color="var(--accent)" />
                        : <Circle size={18} color="var(--text-tertiary)" />
                      }
                    </button>
                  </td>
                  <td>
                    <div className="task-name-cell">
                      <span className={`task-name ${task.done ? 'task-name-done' : ''}`}>{task.name || '—'}</span>
                    </div>
                  </td>
                  <td className="cell-secondary">{task.owner || '—'}</td>
                  <td className={isOverdue(task.dueDate, task.done) ? 'cell-overdue' : 'cell-secondary'}>
                    {formatDate(task.dueDate)}
                    {isOverdue(task.dueDate, task.done) && <span className="overdue-tag">Overdue</span>}
                  </td>
                  <td><PriorityBadge priority={task.priority} /></td>
                  <td className="cell-secondary">{formatDate(task.lastUpdate)}</td>
                  <td>
                    {task.notes
                      ? <span className="notes-tooltip-wrap">
                          <span className="task-note-hint">Note</span>
                          <span className="notes-tooltip">{task.notes}</span>
                        </span>
                      : <span className="cell-secondary">—</span>
                    }
                  </td>
                  <td>
                    <div className="row-actions">
                      <button className="action-btn" onClick={() => openEdit(task)} aria-label="Edit task">
                        <Pencil size={14} />
                      </button>
                      <button className="action-btn action-delete" onClick={() => deleteTask(task.id)} aria-label="Delete task">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>

      {modalTask && (
        <TaskModal task={modalTask} onSave={handleSave} onClose={() => setModalTask(null)} />
      )}
    </div>
  );
}
