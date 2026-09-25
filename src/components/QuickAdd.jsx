import { useMemo, useState } from 'react'
import { parseQuickAdd } from '../lib/parse'
import { addDays, formatDay, formatTime, fromKey, toKey } from '../lib/dates'
import { parseTagInput } from '../lib/tasks'
import { PRIORITY_OPTIONS, priorityStyle } from './priority'
import { CalendarIcon, ClockIcon, FlagIcon, PlusIcon, TagIcon, XIcon } from './Icons'

// Values picked with the toolbar override what was typed in the text
// (undefined = not picked). Tags from both sources are combined.
const EMPTY_PICKS = { due: undefined, time: undefined, priority: undefined, tags: [], removedTags: [] }

const TIME_PRESETS = ['09:00', '12:00', '15:00', '18:00', '20:00']

export default function QuickAdd({ onAdd, today, defaultDue, allTags }) {
  const [value, setValue] = useState('')
  const [picks, setPicks] = useState(EMPTY_PICKS)
  const [panel, setPanel] = useState(null) // 'date' | 'time' | 'priority' | 'tags' | null
  const [newTag, setNewTag] = useState('')

  const parsed = useMemo(() => parseQuickAdd(value), [value])

  // What the task will actually be created with
  const tags = [...new Set([...parsed.tags, ...picks.tags])].filter((t) => !picks.removedTags.includes(t))
  const time = picks.time !== undefined ? picks.time : parsed.time
  let due = picks.due !== undefined ? picks.due : (parsed.due ?? defaultDue)
  if (time && !due) due = today
  const priority = picks.priority ?? parsed.priority
  const canSubmit = value.trim().length > 0

  const update = (patch) => setPicks((p) => ({ ...p, ...patch }))
  const togglePanel = (name) => setPanel((p) => (p === name ? null : name))

  const toggleTag = (tag) => {
    if (tags.includes(tag)) {
      update({ tags: picks.tags.filter((t) => t !== tag), removedTags: [...picks.removedTags, tag] })
    } else {
      update({ tags: [...picks.tags, tag], removedTags: picks.removedTags.filter((t) => t !== tag) })
    }
  }

  const addNewTags = () => {
    const added = parseTagInput(newTag)
    if (!added.length) return
    update({
      tags: [...new Set([...picks.tags, ...added])],
      removedTags: picks.removedTags.filter((t) => !added.includes(t)),
    })
    setNewTag('')
  }

  const submit = (e) => {
    e.preventDefault()
    if (!canSubmit) return
    onAdd({ title: parsed.title, due, time, priority, tags })
    setValue('')
    setPicks(EMPTY_PICKS)
    setPanel(null)
  }

  const todayDate = fromKey(today)
  const dateOptions = [
    ['Today', today],
    ['Tomorrow', toKey(addDays(todayDate, 1))],
    ['Next week', toKey(addDays(todayDate, ((8 - todayDate.getDay()) % 7) || 7))],
    ['No date', null],
  ]
  const tagChoices = [...new Set([...allTags, ...tags])].sort()
  const p = priorityStyle(priority)

  return (
    <form
      onSubmit={submit}
      onKeyDown={(e) => e.key === 'Escape' && setPanel(null)}
      className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800"
    >
      <div className="flex items-center gap-2 p-1.5 pl-4">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Add a task…"
          aria-label="New task"
          enterKeyHint="done"
          autoComplete="off"
          className="min-w-0 flex-1 bg-transparent py-2 text-base outline-none placeholder:text-slate-400"
        />
        <button
          type="submit"
          disabled={!canSubmit}
          aria-label="Add task"
          className="grid size-10 shrink-0 place-items-center rounded-xl bg-indigo-600 text-white transition hover:bg-indigo-500 disabled:bg-slate-200 disabled:text-slate-400 dark:disabled:bg-slate-800 dark:disabled:text-slate-600"
        >
          <PlusIcon />
        </button>
      </div>

      {/* Toolbar: each button shows the current value and opens its picker */}
      <div className="flex flex-wrap gap-1.5 border-t border-slate-100 px-3 py-2 dark:border-slate-800">
        <ToolButton icon={CalendarIcon} active={panel === 'date'} set={!!due} onClick={() => togglePanel('date')}>
          {due ? formatDay(due, today) : 'Date'}
        </ToolButton>
        <ToolButton icon={ClockIcon} active={panel === 'time'} set={!!time} onClick={() => togglePanel('time')}>
          {time ? formatTime(time) : 'Time'}
        </ToolButton>
        <ToolButton
          icon={FlagIcon}
          active={panel === 'priority'}
          set={priority > 0}
          onClick={() => togglePanel('priority')}
          iconClass={priority > 0 ? p.text : ''}
        >
          {priority > 0 ? p.label : 'Priority'}
        </ToolButton>
        <ToolButton icon={TagIcon} active={panel === 'tags'} set={tags.length > 0} onClick={() => togglePanel('tags')}>
          {tags.length === 0 ? 'Tags' : tags.length === 1 ? `#${tags[0]}` : `#${tags[0]} +${tags.length - 1}`}
        </ToolButton>
      </div>

      {panel && (
        <div className="border-t border-slate-100 px-3 py-3 dark:border-slate-800">
          {panel === 'date' && (
            <div className="flex flex-wrap items-center gap-1.5">
              {dateOptions.map(([label, key]) => (
                <Option key={label} selected={due === key} onClick={() => update({ due: key, ...(key ? {} : { time: null }) })}>
                  {label}
                </Option>
              ))}
              <input
                type="date"
                aria-label="Pick a date"
                value={due ?? ''}
                onChange={(e) => update({ due: e.target.value || null })}
                className="rounded-full bg-slate-100 px-3 py-1 text-sm outline-none ring-indigo-500 focus:ring-2 dark:bg-slate-800 dark:[color-scheme:dark]"
              />
            </div>
          )}

          {panel === 'time' && (
            <div className="flex flex-wrap items-center gap-1.5">
              {TIME_PRESETS.map((t) => (
                <Option key={t} selected={time === t} onClick={() => update({ time: t })}>
                  {formatTime(t)}
                </Option>
              ))}
              <input
                type="time"
                aria-label="Pick a time"
                value={time ?? ''}
                onChange={(e) => update({ time: e.target.value || null })}
                className="rounded-full bg-slate-100 px-3 py-1 text-sm outline-none ring-indigo-500 focus:ring-2 dark:bg-slate-800 dark:[color-scheme:dark]"
              />
              {time && (
                <Option selected={false} onClick={() => update({ time: null })}>
                  No time
                </Option>
              )}
            </div>
          )}

          {panel === 'priority' && (
            <div className="grid grid-cols-4 gap-1.5">
              {PRIORITY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    update({ priority: opt.value })
                    setPanel(null)
                  }}
                  aria-pressed={priority === opt.value}
                  className={`flex items-center justify-center gap-1.5 rounded-xl py-2 text-sm transition ${
                    priority === opt.value
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                      : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700'
                  }`}
                >
                  <span className={`size-2 rounded-full ${opt.fill}`} />
                  {opt.label}
                </button>
              ))}
            </div>
          )}

          {panel === 'tags' && (
            <div className="space-y-2">
              {tagChoices.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {tagChoices.map((t) => (
                    <Option key={t} selected={tags.includes(t)} onClick={() => toggleTag(t)}>
                      #{t}
                    </Option>
                  ))}
                </div>
              )}
              <div className="flex gap-1.5">
                <input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addNewTags()
                    }
                  }}
                  placeholder="New tag"
                  aria-label="New tag"
                  autoCapitalize="none"
                  autoComplete="off"
                  enterKeyHint="enter"
                  className="min-w-0 flex-1 rounded-full bg-slate-100 px-3 py-1.5 text-sm outline-none ring-indigo-500 focus:ring-2 dark:bg-slate-800"
                />
                <button
                  type="button"
                  onClick={addNewTags}
                  disabled={!newTag.trim()}
                  className="rounded-full bg-indigo-600 px-4 text-sm font-medium text-white disabled:bg-slate-200 disabled:text-slate-400 dark:disabled:bg-slate-800 dark:disabled:text-slate-600"
                >
                  Add
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </form>
  )
}

function ToolButton({ icon: Icon, active, set, onClick, iconClass = '', children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={active}
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition ${
        set
          ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300'
          : 'text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
      } ${active ? 'ring-2 ring-indigo-500' : ''}`}
    >
      <Icon width={16} height={16} className={iconClass} />
      {children}
    </button>
  )
}

function Option({ selected, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`rounded-full px-3 py-1 text-sm transition ${
        selected ? 'bg-indigo-600 text-white' : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700'
      }`}
    >
      {children}
    </button>
  )
}
