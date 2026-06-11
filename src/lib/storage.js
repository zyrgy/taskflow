const KEY = 'taskflow_tasks';

export function loadTasks() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : defaultTasks();
  } catch {
    return defaultTasks();
  }
}

export function saveTasks(tasks) {
  try {
    localStorage.setItem(KEY, JSON.stringify(tasks));
  } catch {}
}

function defaultTasks() {
  const today = new Date().toISOString().split('T')[0];
  return [
    {
      id: '1',
      name: 'Define project scope',
      owner: 'Alex Kim',
      dueDate: today,
      priority: 'high',
      lastUpdate: today,
      notes: 'Align with stakeholders before kickoff.',
      done: false,
      createdAt: Date.now(),
    },
    {
      id: '2',
      name: 'Design system setup',
      owner: 'Sam Rivera',
      dueDate: today,
      priority: 'medium',
      lastUpdate: today,
      notes: '',
      done: false,
      createdAt: Date.now() - 1000,
    },
  ];
}

export function newTask() {
  const today = new Date().toISOString().split('T')[0];
  return {
    id: crypto.randomUUID(),
    name: '',
    owner: '',
    dueDate: today,
    priority: 'medium',
    lastUpdate: today,
    notes: '',
    done: false,
    createdAt: Date.now(),
  };
}
