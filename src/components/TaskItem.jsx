import { formatDay, formatTime } from '../lib/dates'
import { priorityStyle } from './priority'
import { CheckIcon, NoteIcon, RepeatIcon } from './Icons'
import { describeRepeat } from '../lib/repeat'

export default function TaskItem({ task, today, onToggle, onOpen, showDate = true }) {
  const p = priorityStyle(task.priority)
  const overdue = !task.done && task.due && task.due < today
  const showMeta = (showDate && task.due) || task.time || task.repeat || task.tags.length > 0 || task.notes

  return (
    <li className="group flex items-start gap-3 px-4 py-3">
      <button
        type="button"
        onClick={() => onToggle(task.id)}
        aria-label={task.done ? `Mark "${task.title}" as not done` : `Complete "${task.title}"`}
        className={`mt-0.5 grid size-6 shrink-0 place-items-center rounded-full border-2 transition ${
          task.done ? `${p.fill} border-transparent text-white` : `${p.ring} text-transparent hover:text-slate-400`
        }`}
      >
        <CheckIcon width={14} height={14} strokeWidth={3} />
      </button>

      <button type="button" onClick={() => onOpen(task)} className="min-w-0 flex-1 text-left">
        <p className={`break-words ${task.done ? 'text-slate-400 line-through dark:text-slate-500' : ''}`}>{task.title}</p>
        {showMeta ? (
          <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-500 dark:text-slate-400">
            {showDate && task.due && (
              <span className={overdue ? 'font-medium text-red-600 dark:text-red-400' : ''}>{formatDay(task.due, today)}</span>
            )}
            {task.time && <span>{formatTime(task.time)}</span>}
            {task.repeat && (
              <span className="inline-flex items-center gap-1">
                <RepeatIcon width={12} height={12} />
                {describeRepeat(task.repeat)}
              </span>
            )}
            {task.notes && <NoteIcon width={13} height={13} aria-label="Has notes" />}
            {task.tags.map((t) => (
              <span key={t} className="text-indigo-600 dark:text-indigo-400">#{t}</span>
            ))}
          </p>
        ) : null}
      </button>
    </li>
  )
}
