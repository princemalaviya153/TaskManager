import { useCallback, useEffect, useRef, useState } from 'react'
import {
  clearLegacyTasks,
  loadCache,
  loadLegacyTasks,
  loadPending,
  saveCache,
  savePending,
} from '../lib/storage'
import { applyPending, fetchTasks, pushOps } from '../lib/sync'
import { supabase } from '../lib/supabase'
import { createTask, isUuid, newId } from '../lib/tasks'
import { todayKey } from '../lib/dates'
import { firstOccurrence, nextDueAfterCompletion, sameRule, withAnchorDay } from '../lib/repeat'

const RETRY_MS = 15_000

const upsert = (task) => ({ type: 'upsert', id: task.id, task })

// A repeating task always has a due date, and month/year rules remember the
// due date's day of the month (reanchor when the date or rule was changed).
function normalize(task, reanchor = true) {
  if (!task.repeat) return task
  const due = task.due ?? firstOccurrence(task.repeat, todayKey())
  const rule = reanchor ? { ...task.repeat, day: undefined } : task.repeat
  return { ...task, due, repeat: withAnchorDay(JSON.parse(JSON.stringify(rule)), due) }
}

// Local-first task list for one account: every change is applied on the device
// immediately, queued, and pushed to Supabase in the background. Changes made
// on other devices arrive through realtime events and on refocus.
//
// status: 'syncing' | 'synced' | 'offline' | 'error'
export function useTasks(userId) {
  const [tasks, setTasksState] = useState(() => loadCache(userId))
  const [status, setStatus] = useState('syncing')
  const [notice, setNotice] = useState(null)

  const tasksRef = useRef(tasks)
  const pendingRef = useRef(loadPending(userId))
  const flushingRef = useRef(false)
  const retryRef = useRef(null)

  const setTasks = useCallback(
    (next) => {
      tasksRef.current = next
      setTasksState(next)
      saveCache(userId, next)
    },
    [userId],
  )

  const hasPending = useCallback(() => Object.keys(pendingRef.current).length > 0, [])

  const fail = useCallback((err) => {
    console.error('Sync failed', err)
    setStatus(navigator.onLine ? 'error' : 'offline')
  }, [])

  const refresh = useCallback(async () => {
    if (!navigator.onLine) return setStatus('offline')
    try {
      const server = await fetchTasks()
      setTasks(applyPending(server, pendingRef.current))
      if (!flushingRef.current) setStatus(hasPending() ? 'syncing' : 'synced')
    } catch (err) {
      fail(err)
    }
  }, [setTasks, hasPending, fail])

  const flush = useCallback(async () => {
    if (flushingRef.current) return
    clearTimeout(retryRef.current)
    if (!hasPending()) return
    if (!navigator.onLine) return setStatus('offline')

    flushingRef.current = true
    setStatus('syncing')
    try {
      // Keep going while new changes are queued during a push
      while (hasPending()) {
        const ops = Object.values(pendingRef.current)
        await pushOps(ops, userId)
        for (const op of ops) {
          // Only drop the op if it wasn't replaced by a newer change meanwhile
          if (pendingRef.current[op.id]?.seq === op.seq) delete pendingRef.current[op.id]
        }
        savePending(userId, pendingRef.current)
      }
      flushingRef.current = false
      setStatus('synced')
      refresh()
    } catch (err) {
      flushingRef.current = false
      fail(err)
      retryRef.current = setTimeout(() => flushRef.current(), RETRY_MS)
    }
  }, [userId, hasPending, fail, refresh])

  const flushRef = useRef(flush)
  flushRef.current = flush

  const enqueue = useCallback(
    (ops) => {
      for (const op of ops) pendingRef.current[op.id] = { ...op, seq: newId() }
      savePending(userId, pendingRef.current)
      flushRef.current()
    },
    [userId],
  )

  useEffect(() => {
    // Move tasks created before accounts existed (Phase 1) into this account
    const legacy = loadLegacyTasks()
    if (legacy.length) {
      const moved = legacy.map((t) => (isUuid(t.id) ? t : { ...t, id: newId() }))
      const ids = new Set(moved.map((t) => t.id))
      setTasks([...tasksRef.current.filter((t) => !ids.has(t.id)), ...moved])
      enqueue(moved.map(upsert))
      clearLegacyTasks()
      setNotice(`Moved ${moved.length} task${moved.length > 1 ? 's' : ''} from this device into your account`)
    }

    refresh().then(() => flushRef.current())

    // Another device changed something -> refetch (debounced)
    let refetchTimer
    const channel = supabase
      .channel(`tasks-${userId}-${newId()}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => {
        clearTimeout(refetchTimer)
        refetchTimer = setTimeout(refresh, 300)
      })
      .subscribe()

    const catchUp = () => {
      flushRef.current()
      refresh()
    }
    const onVisible = () => document.visibilityState === 'visible' && catchUp()
    const onOffline = () => setStatus('offline')
    window.addEventListener('online', catchUp)
    window.addEventListener('offline', onOffline)
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      clearTimeout(refetchTimer)
      clearTimeout(retryRef.current)
      supabase.removeChannel(channel)
      window.removeEventListener('online', catchUp)
      window.removeEventListener('offline', onOffline)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [userId, refresh, enqueue, setTasks])

  const addTask = useCallback(
    (fields) => {
      const task = normalize(createTask(fields))
      setTasks([...tasksRef.current, task])
      enqueue([upsert(task)])
      return task
    },
    [setTasks, enqueue],
  )

  const updateTask = useCallback(
    (id, patch) => {
      const current = tasksRef.current.find((t) => t.id === id)
      if (!current) return
      const reanchor =
        ('due' in patch && patch.due !== current.due) || ('repeat' in patch && !sameRule(patch.repeat, current.repeat))
      const task = normalize({ ...current, ...patch }, reanchor)
      setTasks(tasksRef.current.map((t) => (t.id === id ? task : t)))
      enqueue([upsert(task)])
    },
    [setTasks, enqueue],
  )

  // Returns an undo function
  const toggleTask = useCallback(
    (id) => {
      const current = tasksRef.current.find((t) => t.id === id)
      if (!current) return () => {}
      const today = todayKey()
      const nextDue = !current.done && current.repeat ? nextDueAfterCompletion(current, today) : null

      if (nextDue) {
        // Repeating: keep a completed copy for history, move the task to its next date
        const record = createTask({ ...current, id: newId(), repeat: null, done: true, completedAt: today, createdAt: new Date().toISOString() })
        const advanced = { ...current, due: nextDue }
        setTasks([...tasksRef.current.map((t) => (t.id === id ? advanced : t)), record])
        enqueue([upsert(advanced), upsert(record)])
        return () => {
          setTasks(tasksRef.current.filter((t) => t.id !== record.id).map((t) => (t.id === id ? current : t)))
          enqueue([{ type: 'delete', id: record.id }, upsert(current)])
        }
      }

      updateTask(id, { done: !current.done, completedAt: current.done ? null : today })
      return () => updateTask(id, { done: current.done, completedAt: current.completedAt })
    },
    [setTasks, enqueue, updateTask],
  )

  const deleteTask = useCallback(
    (id) => {
      setTasks(tasksRef.current.filter((t) => t.id !== id))
      enqueue([{ type: 'delete', id }])
    },
    [setTasks, enqueue],
  )

  const restoreTask = useCallback(
    (task) => {
      if (tasksRef.current.some((t) => t.id === task.id)) return
      setTasks([...tasksRef.current, task])
      enqueue([upsert(task)])
    },
    [setTasks, enqueue],
  )

  const clearCompleted = useCallback(() => {
    const done = tasksRef.current.filter((t) => t.done)
    setTasks(tasksRef.current.filter((t) => !t.done))
    enqueue(done.map((t) => ({ type: 'delete', id: t.id })))
  }, [setTasks, enqueue])

  const dismissNotice = useCallback(() => setNotice(null), [])

  return {
    tasks,
    status,
    notice,
    dismissNotice,
    hasPending,
    addTask,
    updateTask,
    toggleTask,
    deleteTask,
    restoreTask,
    clearCompleted,
  }
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
