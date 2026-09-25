// Device-side storage. The cloud (Supabase) is the source of truth; this keeps
// a per-account copy so the app opens instantly and works offline, plus a
// queue of changes that haven't reached the server yet.

// Where Phase 1 kept tasks before accounts existed
const LEGACY_KEY = 'taskmanager.tasks.v1'
const cacheKey = (userId) => `taskmanager.${userId}.tasks`
const pendingKey = (userId) => `taskmanager.${userId}.pending`

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (err) {
    console.error('Could not save to this device', err)
  }
}

function remove(key) {
  try {
    localStorage.removeItem(key)
  } catch {
    // ignore
  }
}

export const loadCache = (userId) => {
  const data = read(cacheKey(userId), [])
  return Array.isArray(data) ? data : []
}
export const saveCache = (userId, tasks) => write(cacheKey(userId), tasks)

// Pending changes: { [taskId]: { type: 'upsert', id, task, seq } | { type: 'delete', id, seq } }
export const loadPending = (userId) => read(pendingKey(userId), {})
export const savePending = (userId, pending) => write(pendingKey(userId), pending)

export function loadLegacyTasks() {
  const data = read(LEGACY_KEY, [])
  return Array.isArray(data) ? data : []
}
export const clearLegacyTasks = () => remove(LEGACY_KEY)

// On sign-out, remove this account's copy from the device
export function clearUserData(userId) {
  remove(cacheKey(userId))
  remove(pendingKey(userId))
}
