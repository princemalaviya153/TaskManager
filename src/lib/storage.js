// Phase 1 keeps tasks on this device. In Phase 2 this module is the one place
// that gets swapped for cloud sync.

export const STORAGE_KEY = 'taskmanager.tasks.v1'

export function loadTasks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const data = raw ? JSON.parse(raw) : []
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}

export function saveTasks(tasks) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks))
  } catch (err) {
    console.error('Could not save tasks', err)
  }
}
