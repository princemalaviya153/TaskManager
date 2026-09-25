import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTasks, useToday } from './hooks/useTasks'
import { compareTasks, groupBy } from './lib/tasks'
import { addDays, formatDay, formatLongDate, fromKey, toKey } from './lib/dates'
import QuickAdd from './components/QuickAdd'
import TaskSection from './components/TaskSection'
import EditTaskSheet from './components/EditTaskSheet'
import Toast from './components/Toast'
import AccountMenu from './components/AccountMenu'
import { supabase } from './lib/supabase'
import { clearUserData } from './lib/storage'
import { CalendarIcon, CheckCircleIcon, InboxIcon, SunIcon } from './components/Icons'

const VIEWS = [
  { id: 'today', label: 'Today', Icon: SunIcon },
  { id: 'upcoming', label: 'Upcoming', Icon: CalendarIcon },
  { id: 'anytime', label: 'Anytime', Icon: InboxIcon },
  { id: 'done', label: 'Done', Icon: CheckCircleIcon },
]

function viewOf(task, today) {
  if (task.done) return 'done'
  if (!task.due) return 'anytime'
  return task.due <= today ? 'today' : 'upcoming'
}

export default function App({ user }) {
  const {
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
  } = useTasks(user.id)
  const today = useToday()
  const [view, setView] = useState('today')
  const [tag, setTag] = useState(null)
  const [editing, setEditing] = useState(null)
  const [toast, setToast] = useState(null)
  const dismissToast = useCallback(() => setToast(null), [])

  useEffect(() => {
    if (!notice) return
    setToast({ message: notice })
    dismissNotice()
  }, [notice, dismissNotice])

  const signOut = async () => {
    if (hasPending() && !confirm("Some changes haven't synced yet and will be lost if you sign out now. Sign out anyway?")) return
    clearUserData(user.id)
    await supabase.auth.signOut()
  }

  const allTags = useMemo(() => [...new Set(tasks.flatMap((t) => t.tags))].sort(), [tasks])
  const activeTag = tag && allTags.includes(tag) ? tag : null

  const filtered = useMemo(
    () => (activeTag ? tasks.filter((t) => t.tags.includes(activeTag)) : tasks),
    [tasks, activeTag],
  )

  const byView = useMemo(() => {
    const out = { today: [], upcoming: [], anytime: [], done: [] }
    for (const t of filtered) out[viewOf(t, today)].push(t)
    for (const key of ['today', 'upcoming', 'anytime']) out[key].sort(compareTasks)
    out.done.sort((a, b) => (a.completedAt < b.completedAt ? 1 : -1))
    return out
  }, [filtered, today])

  // Date a new task gets when none is typed or picked
  const defaultDue = { today, upcoming: toKey(addDays(fromKey(today), 1)) }[view] ?? null

  const handleAdd = (fields) => {
    const task = addTask(fields)
    const landed = viewOf(task, today)
    if (landed !== view) {
      const where = landed === 'upcoming' ? formatDay(task.due, today) : VIEWS.find((v) => v.id === landed).label
      setToast({ message: `Added to ${where}`, action: { label: 'View', run: () => setView(landed) } })
    }
  }

  const handleToggle = (id) => {
    const task = tasks.find((t) => t.id === id)
    toggleTask(id)
    if (task && !task.done) {
      setToast({ message: 'Task completed', action: { label: 'Undo', run: () => toggleTask(id) } })
    }
  }

  const handleDelete = (task) => {
    deleteTask(task.id)
    setToast({ message: 'Task deleted', action: { label: 'Undo', run: () => restoreTask(task) } })
  }

  const itemProps = { today, onToggle: handleToggle, onOpen: setEditing }
  const current = VIEWS.find((v) => v.id === view)
  const counts = {
    today: byView.today.length,
    upcoming: byView.upcoming.length,
    anytime: byView.anytime.length,
    done: 0,
  }

  return (
    <div className="min-h-dvh md:flex">
      {/* Navigation: bottom bar on phones, sidebar on larger screens */}
      <nav
        aria-label="Views"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/90 pb-[env(safe-area-inset-bottom)] backdrop-blur md:sticky md:top-0 md:h-dvh md:w-60 md:shrink-0 md:border-t-0 md:border-r md:bg-transparent md:p-4 md:backdrop-blur-none dark:border-slate-800 dark:bg-slate-950/90 md:dark:bg-transparent"
      >
        <div className="mb-6 hidden items-center gap-2 px-2 pt-2 md:flex">
          <img src="/icon.svg" alt="" className="size-7" />
          <span className="text-lg font-semibold">TaskManager</span>
        </div>
        <ul className="grid grid-cols-4 md:grid-cols-1 md:gap-1">
          {VIEWS.map(({ id, label, Icon }) => {
            const active = view === id
            return (
              <li key={id}>
                <button
                  type="button"
                  onClick={() => setView(id)}
                  aria-current={active ? 'page' : undefined}
                  className={`flex w-full flex-col items-center gap-0.5 py-2 text-[11px] font-medium transition md:flex-row md:gap-3 md:rounded-xl md:px-3 md:py-2.5 md:text-sm ${
                    active
                      ? 'text-indigo-600 md:bg-indigo-50 dark:text-indigo-400 md:dark:bg-indigo-950/60'
                      : 'text-slate-500 hover:text-slate-900 md:hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white md:dark:hover:bg-slate-900'
                  }`}
                >
                  <Icon />
                  <span className="md:flex-1 md:text-left">{label}</span>
                  {counts[id] > 0 && <span className="hidden text-xs text-slate-400 md:inline">{counts[id]}</span>}
                </button>
              </li>
            )
          })}
        </ul>
      </nav>

      <main className="mx-auto w-full max-w-2xl px-4 pt-[max(1.5rem,env(safe-area-inset-top))] pb-[calc(6rem+env(safe-area-inset-bottom))] md:pb-12">
        <header className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{current.label}</h1>
            {view === 'today' && <p className="text-sm text-slate-500 dark:text-slate-400">{formatLongDate(today)}</p>}
          </div>
          <AccountMenu email={user.email} status={status} onSignOut={signOut} />
        </header>

        {view !== 'done' && <QuickAdd onAdd={handleAdd} today={today} defaultDue={defaultDue} allTags={allTags} />}

        {allTags.length > 0 && (
          <div className="-mx-4 mt-3 flex gap-1.5 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
            {[null, ...allTags].map((t) => (
              <button
                key={t ?? '__all'}
                type="button"
                onClick={() => setTag(t)}
                aria-pressed={activeTag === t}
                className={`shrink-0 rounded-full px-3 py-1 text-sm transition ${
                  activeTag === t
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-800 dark:hover:bg-slate-800'
                }`}
              >
                {t ? `#${t}` : 'All'}
              </button>
            ))}
          </div>
        )}

        {view === 'today' && <TodayView tasks={byView.today} doneToday={byView.done.filter((t) => t.completedAt === today)} {...itemProps} />}
        {view === 'upcoming' && <UpcomingView tasks={byView.upcoming} {...itemProps} />}
        {view === 'anytime' && (
          <>
            <TaskSection title="No due date" tasks={byView.anytime} {...itemProps} />
            {byView.anytime.length === 0 && <Empty title="Nothing here" text="Tasks without a due date show up here." />}
          </>
        )}
        {view === 'done' && (
          <DoneView
            tasks={byView.done}
            onClear={() => {
              if (confirm(`Delete ${tasks.filter((t) => t.done).length} completed tasks permanently?`)) clearCompleted()
            }}
            {...itemProps}
          />
        )}
      </main>

      {editing && (
        <EditTaskSheet key={editing.id} task={editing} onSave={updateTask} onDelete={handleDelete} onClose={() => setEditing(null)} />
      )}
      {!editing && <Toast toast={toast} onDismiss={dismissToast} />}
    </div>
  )
}

function TodayView({ tasks, doneToday, today, ...itemProps }) {
  const overdue = tasks.filter((t) => t.due < today)
  const dueToday = tasks.filter((t) => t.due === today)
  return (
    <>
      <TaskSection title="Overdue" tone="danger" tasks={overdue} today={today} {...itemProps} />
      <TaskSection title="Today" tasks={dueToday} today={today} showDate={false} {...itemProps} />
      {tasks.length === 0 && (
        <Empty
          title={doneToday.length ? 'All done for today 🎉' : 'A clear day'}
          text={doneToday.length ? `You completed ${doneToday.length} task${doneToday.length > 1 ? 's' : ''} today.` : 'Add something you want to get done today.'}
        />
      )}
      <TaskSection title="Completed today" tasks={doneToday} today={today} showDate={false} {...itemProps} />
    </>
  )
}

function UpcomingView({ tasks, today, ...itemProps }) {
  const groups = groupBy(tasks, (t) => t.due)
  if (tasks.length === 0) return <Empty title="Nothing scheduled" text="Tasks with a future due date appear here, grouped by day." />
  return [...groups].map(([due, items]) => (
    <TaskSection
      key={due}
      title={`${formatDay(due, today)} · ${fromKey(due).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`}
      tasks={items}
      today={today}
      showDate={false}
      {...itemProps}
    />
  ))
}

function DoneView({ tasks, today, onClear, ...itemProps }) {
  if (tasks.length === 0) return <Empty title="No completed tasks yet" text="Tasks you finish will be listed here." />
  const groups = groupBy(tasks, (t) => t.completedAt ?? 'earlier')
  return [...groups].map(([day, items], i) => (
    <TaskSection
      key={day}
      title={day === 'earlier' ? 'Earlier' : formatDay(day, today)}
      tasks={items}
      today={today}
      action={
        i === 0 ? (
          <button type="button" onClick={onClear} className="text-xs font-medium text-red-600 hover:underline dark:text-red-400">
            Clear all
          </button>
        ) : null
      }
      {...itemProps}
    />
  ))
}

function Empty({ title, text }) {
  return (
    <div className="mt-16 text-center">
      <p className="font-medium">{title}</p>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{text}</p>
    </div>
  )
}
