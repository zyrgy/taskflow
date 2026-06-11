const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY;

async function query(path, options = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      Prefer: options.prefer || '',
    },
    ...options,
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

// Categories
export async function fetchCategories() {
  return query('categories?order=created_at.asc');
}

export async function createCategory(cat) {
  return query('categories', {
    method: 'POST',
    prefer: 'return=representation',
    body: JSON.stringify({ name: cat.name, color: cat.color }),
  });
}

export async function deleteCategory(id) {
  return query(`categories?id=eq.${id}`, { method: 'DELETE' });
}

export async function replaceCategories(incoming, existing) {
  const toDelete = existing.filter(e => !incoming.find(i => i.id === e.id));
  const toCreate = incoming.filter(i => !existing.find(e => e.id === i.id));

  await Promise.all(toDelete.map(c => deleteCategory(c.id)));
  const created = await Promise.all(toCreate.map(c => createCategory(c)));
  return [
    ...incoming.filter(i => existing.find(e => e.id === i.id)),
    ...created.flat(),
  ];
}

// Tasks
export async function fetchTasks() {
  return query('tasks?order=created_at.asc');
}

export async function createTask(task) {
  const row = taskToRow(task);
  const result = await query('tasks', {
    method: 'POST',
    prefer: 'return=representation',
    body: JSON.stringify(row),
  });
  return rowToTask(result[0]);
}

export async function updateTask(task) {
  const row = taskToRow(task);
  const result = await query(`tasks?id=eq.${task.id}`, {
    method: 'PATCH',
    prefer: 'return=representation',
    body: JSON.stringify(row),
  });
  return rowToTask(result[0]);
}

export async function deleteTask(id) {
  return query(`tasks?id=eq.${id}`, { method: 'DELETE' });
}

function taskToRow(task) {
  return {
    id: task.id,
    name: task.name,
    owner: task.owner,
    due_date: task.dueDate || null,
    priority: task.priority,
    last_update: task.lastUpdate || null,
    notes: task.notes,
    done: task.done,
    category_id: task.categoryId || null,
  };
}

export function rowToTask(row) {
  return {
    id: row.id,
    name: row.name,
    owner: row.owner || '',
    dueDate: row.due_date || '',
    priority: row.priority,
    lastUpdate: row.last_update || '',
    notes: row.notes || '',
    done: row.done,
    categoryId: row.category_id || '',
    createdAt: new Date(row.created_at).getTime(),
  };
}
