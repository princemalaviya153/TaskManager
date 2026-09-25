import { useCallback, useEffect, useState } from 'react'
import { STORAGE_KEY, loadTasks, saveTasks } from '../lib/storage'
import { createTask } from '../lib/tasks'
import { todayKey } from '../lib/dates'

export function useTasks() {
  const [tasks, setTasks] = useState(loadTasks)

  useEffect(() => saveTasks(tasks), [tasks])

  // Keep multiple open tabs in sync
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === STORAGE_KEY) setTasks(loadTasks())
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const addTask = useCallback((fields) => {
    const task = createTask(fields)
    setTasks((prev) => [...prev, task])
    return task
  }, [])

  const updateTask = useCallback((id, patch) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)))
  }, [])

  const toggleTask = useCallback((id) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, done: !t.done, completedAt: t.done ? null : todayKey() } : t,
      ),
    )
  }, [])

  const deleteTask = useCallback((id) => {
    setTasks((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const restoreTask = useCallback((task) => {
    setTasks((prev) => (prev.some((t) => t.id === task.id) ? prev : [...prev, task]))
  }, [])

  const clearCompleted = useCallback(() => {
    setTasks((prev) => prev.filter((t) => !t.done))
  }, [])

  return { tasks, addTask, updateTask, toggleTask, deleteTask, restoreTask, clearCompleted }
}

// Re-renders when the date changes (app left open overnight, or reopened from the home screen)
export function useToday() {
  const [today, setToday] = useState(todayKey)
  useEffect(() => {
    const tick = () => setToday(todayKey())
    const id = setInterval(tick, 60_000)
    document.addEventListener('visibilitychange', tick)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', tick)
    }
  }, [])
  return today
}
