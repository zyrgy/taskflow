const TASKS_KEY = 'taskflow_tasks';
const CATS_KEY = 'taskflow_categories';

export function loadTasks() {
  try {
    const raw = localStorage.getItem(TASKS_KEY);
    return raw ? JSON.parse(raw) : defaultTasks();
  } catch { return defaultTasks(); }
}

export function saveTasks(tasks) {
  try { localStorage.setItem(TASKS_KEY, JSON.stringify(tasks)); } catch {}
}

export function loadCategories() {
  try {
    const raw = localStorage.getItem(CATS_KEY);
    return raw ? JSON.parse(raw) : defaultCategories();
  } catch { return defaultCategories(); }
}

export function saveCategories(cats) {
  try { localStorage.setItem(CATS_KEY, JSON.stringify(cats)); } catch {}
}

function defaultCategories() {
  return [
    { id: 'cat-1', name: 'Design', color: '#7C3AED' },
    { id: 'cat-2', name: 'Engineering', color: '#0369A1' },
    { id: 'cat-3', name: 'Marketing', color: '#B45309' },
  ];
}

function defaultTasks() {
  const today = new Date().toISOString().split('T')[0];
  return [
    { id: '1', name: 'Define project scope', owner: 'Alex Kim', dueDate: today, priority: 'high', lastUpdate: today, notes: 'Align with stakeholders before kickoff.', done: false, createdAt: Date.now(), categoryId: 'cat-2' },
    { id: '2', name: 'Design system setup', owner: 'Sam Rivera', dueDate: today, priority: 'medium', lastUpdate: today, notes: '', done: false, createdAt: Date.now() - 1000, categoryId: 'cat-1' },
  ];
}

export function newTask() {
  const today = new Date().toISOString().split('T')[0];
  return { id: crypto.randomUUID(), name: '', owner: '', dueDate: today, priority: 'medium', lastUpdate: today, notes: '', done: false, createdAt: Date.now(), categoryId: '' };
}

export function newCategory(name, color) {
  return { id: crypto.randomUUID(), name: name.trim(), color };
}
