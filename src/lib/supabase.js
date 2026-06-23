import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = (process.env.REACT_APP_SUPABASE_URL || '').replace(/\/$/, '');
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Auth
export async function signInWithGoogle() {
  await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin },
  });
}

export async function signOut() {
  await supabase.auth.signOut();
}

export async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export function onAuthStateChange(callback) {
  return supabase.auth.onAuthStateChange((_event, session) => callback(session));
}

// Categories
export async function fetchCategories() {
  const { data, error } = await supabase.from('categories').select('*').order('created_at');
  if (error) throw new Error(error.message);
  return data;
}

export async function createCategory(cat) {
  const { data, error } = await supabase.from('categories').insert({ name: cat.name, color: cat.color }).select().single();
  if (error) throw new Error(error.message);
  return data;
}

export async function deleteCategory(id) {
  const { error } = await supabase.from('categories').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export async function replaceCategories(incoming, existing) {
  const toDelete = existing.filter(e => !incoming.find(i => i.id === e.id));
  const toCreate = incoming.filter(i => !existing.find(e => e.id === i.id));
  await Promise.all(toDelete.map(c => deleteCategory(c.id)));
  const created = await Promise.all(toCreate.map(c => createCategory(c)));
  return [
    ...incoming.filter(i => existing.find(e => e.id === i.id)),
    ...created,
  ];
}

// Tasks
export async function fetchTasks() {
  const { data, error } = await supabase.from('tasks').select('*').order('created_at');
  if (error) throw new Error(error.message);
  console.log('fetchTasks raw:', JSON.stringify(data[0]));
  return data.map(rowToTask);
}

export async function createTask(task) {
  const { data, error } = await supabase.from('tasks').insert(taskToRow(task)).select().single();
  if (error) throw new Error(error.message);
  return rowToTask(data);
}

export async function updateTask(task) {
  const row = taskToRow(task);
  delete row.id;
  console.log('updateTask sending:', JSON.stringify(row));
  const { data, error } = await supabase.from('tasks').update(row).eq('id', task.id).select().single();
  if (error) { console.error('Update error', error); throw new Error(error.message); }
  console.log('updateTask DB response:', JSON.stringify(data));
  return rowToTask(data);
}

export async function deleteTask(id) {
  const { error } = await supabase.from('tasks').delete().eq('id', id);
  if (error) throw new Error(error.message);
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
