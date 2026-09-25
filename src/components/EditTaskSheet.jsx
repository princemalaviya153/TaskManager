import { useEffect, useState } from 'react'
import { addDays, toKey } from '../lib/dates'
import { parseTagInput } from '../lib/tasks'
import { PRIORITY_OPTIONS } from './priority'
import { TrashIcon, XIcon } from './Icons'

export default function EditTaskSheet({ task, onSave, onDelete, onClose }) {
  const [form, setForm] = useState(() => ({
    title: task.title,
    notes: task.notes,
    due: task.due ?? '',
    time: task.time ?? '',
    priority: task.priority,
    tags: task.tags.map((t) => `#${t}`).join(' '),
  }))

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const save = (e) => {
    e.preventDefault()
    const title = form.title.trim()
    if (!title) return
    onSave(task.id, {
      title,
      notes: form.notes.trim(),
      due: form.due || null,
      time: form.time || null,
      priority: form.priority,
      tags: parseTagInput(form.tags),
    })
    onClose()
  }

  const quickDates = [
    ['Today', toKey(new Date())],
    ['Tomorrow', toKey(addDays(new Date(), 1))],
    ['Next week', toKey(addDays(new Date(), 7))],
    ['No date', ''],
  ]

  const label = 'mb-1.5 block text-xs font-medium text-slate-500 dark:text-slate-400'
  const input =
    'w-full rounded-xl bg-slate-100 px-3 py-2.5 text-base outline-none ring-indigo-500 focus:ring-2 dark:bg-slate-800 dark:[color-scheme:dark]'

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-label="Edit task">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]" onClick={onClose} />
      <form
        onSubmit={save}
        className="relative max-h-[92dvh] w-full overflow-y-auto rounded-t-3xl bg-white p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-xl sm:max-w-lg sm:rounded-3xl dark:bg-slate-900"
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-slate-200 sm:hidden dark:bg-slate-700" />
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Edit task</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="grid size-9 place-items-center rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
            <XIcon width={20} height={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className={label} htmlFor="t-title">Title</label>
            <input id="t-title" className={input} value={form.title} onChange={set('title')} autoFocus />
          </div>

          <div>
            <label className={label} htmlFor="t-notes">Notes</label>
            <textarea id="t-notes" rows={3} className={`${input} resize-none`} value={form.notes} onChange={set('notes')} placeholder="Add details…" />
          </div>

          <div>
            <span className={label}>Due</span>
            <div className="mb-2 flex flex-wrap gap-1.5">
              {quickDates.map(([name, key]) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, due: key, time: key ? f.time : '' }))}
                  className={`rounded-full px-3 py-1 text-sm transition ${
                    form.due === key ? 'bg-indigo-600 text-white' : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700'
                  }`}
                >
                  {name}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input type="date" aria-label="Due date" className={input} value={form.due} onChange={set('due')} />
              <input type="time" aria-label="Due time" className={input} value={form.time} onChange={set('time')} disabled={!form.due} />
            </div>
          </div>

          <div>
            <span className={label}>Priority</span>
            <div className="grid grid-cols-4 gap-1.5">
              {PRIORITY_OPTIONS.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, priority: p.value }))}
                  aria-pressed={form.priority === p.value}
                  className={`flex items-center justify-center gap-1.5 rounded-xl py-2 text-sm transition ${
                    form.priority === p.value
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                      : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700'
                  }`}
                >
                  <span className={`size-2 rounded-full ${p.fill}`} />
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className={label} htmlFor="t-tags">Tags</label>
            <input id="t-tags" className={input} value={form.tags} onChange={set('tags')} placeholder="#work #home" autoCapitalize="none" />
          </div>
        </div>

        <div className="mt-6 flex gap-2">
          <button
            type="button"
            onClick={() => {
              onDelete(task)
              onClose()
            }}
            className="flex items-center gap-1.5 rounded-xl px-4 py-3 font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
          >
            <TrashIcon width={18} height={18} />
            Delete
          </button>
          <button type="submit" className="flex-1 rounded-xl bg-indigo-600 py-3 font-medium text-white hover:bg-indigo-500">
            Save
          </button>
        </div>
      </form>
    </div>
  )
}
