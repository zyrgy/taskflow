const SUPABASE_URL = (process.env.REACT_APP_SUPABASE_URL || '').replace(/\/$/, '');
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY;

// Auth
export async function signInWithGoogle() {
  const redirectTo = window.location.origin;
  const res = await fetch(`${SUPABASE_URL}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(redirectTo)}`, {
    headers: { apikey: SUPABASE_ANON_KEY },
  });
  // Supabase returns a redirect — we follow it
  window.location.href = `${SUPABASE_URL}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(redirectTo)}`;
}

export async function signOut() {
  const session = getSession();
  await fetch(`${SUPABASE_URL}/auth/v1/logout`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${session?.access_token}`,
    },
  });
  clearSession();
}

export function getSession() {
  try {
    const raw = localStorage.getItem('taskflow_session');
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveSession(session) {
  localStorage.setItem('taskflow_session', JSON.stringify(session));
}

function clearSession() {
  localStorage.removeItem('taskflow_session');
}

export async function exchangeCodeForSession(code) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=pkce`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_ANON_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ auth_code: code }),
  });
  if (!res.ok) throw new Error('Failed to exchange code');
  const data = await res.json();
  saveSession(data);
  return data;
}

export async function refreshSession(refresh_token) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_ANON_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ refresh_token }),
  });
  if (!res.ok) { clearSession(); return null; }
  const data = await res.json();
  saveSession(data);
  return data;
}

export async function getValidSession() {
  let session = getSession();
  if (!session) return null;
  // Check if token is expired (with 60s buffer)
  const payload = JSON.parse(atob(session.access_token.split('.')[1]));
  if (payload.exp * 1000 < Date.now() + 60000) {
    session = await refreshSession(session.refresh_token);
  }
  return session;
}

// DB query with auth
async function query(path, options = {}) {
  const session = await getValidSession();
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${session?.access_token || SUPABASE_ANON_KEY}`,
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
