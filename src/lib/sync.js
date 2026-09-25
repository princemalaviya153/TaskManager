import { supabase } from './supabase'

const PAGE = 1000

const toRow = (task, userId) => ({
  id: task.id,
  user_id: userId,
  title: task.title,
  notes: task.notes ?? '',
  due: task.due,
  time: task.time,
  priority: task.priority,
  tags: task.tags,
  done: task.done,
  completed_at: task.completedAt,
  created_at: task.createdAt,
})

const fromRow = (row) => ({
  id: row.id,
  title: row.title,
  notes: row.notes ?? '',
  due: row.due,
  time: row.time,
  priority: row.priority,
  tags: row.tags ?? [],
  done: row.done,
  completedAt: row.completed_at,
  createdAt: new Date(row.created_at).toISOString(),
})

// All of the signed-in user's tasks (RLS limits rows to their own)
export async function fetchTasks() {
  const all = []
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at')
      .range(from, from + PAGE - 1)
    if (error) throw error
    all.push(...data)
    if (data.length < PAGE) break
  }
  return all.map(fromRow)
}

// Sends queued changes in at most two requests
export async function pushOps(ops, userId) {
  const upserts = ops.filter((o) => o.type === 'upsert').map((o) => toRow(o.task, userId))
  const deletes = ops.filter((o) => o.type === 'delete').map((o) => o.id)
  if (upserts.length) {
    const { error } = await supabase.from('tasks').upsert(upserts)
    if (error) throw error
  }
  if (deletes.length) {
    const { error } = await supabase.from('tasks').delete().in('id', deletes)
    if (error) throw error
  }
}

// Server state with this device's not-yet-synced changes applied on top
export function applyPending(serverTasks, pending) {
  const byId = new Map(serverTasks.map((t) => [t.id, t]))
  for (const op of Object.values(pending)) {
    if (op.type === 'delete') byId.delete(op.id)
    else byId.set(op.id, op.task)
  }
  return [...byId.values()]
}
