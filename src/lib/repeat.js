import { addDays, fromKey, toKey } from './dates.js'

// A repeat rule: { every: 1, unit: 'day' | 'week' | 'month' | 'year', weekdays?: [0-6], day?: 1-31 }
// weekdays (0 = Sunday) only applies to unit 'week'. Month/year rules repeat on
// `day` of the month; a 31st becomes the last day in shorter months and returns
// to the 31st afterwards.

export const REPEAT_PRESETS = [
  { id: 'daily', label: 'Every day', rule: { every: 1, unit: 'day' } },
  { id: 'weekdays', label: 'Every weekday', rule: { every: 1, unit: 'week', weekdays: [1, 2, 3, 4, 5] } },
  { id: 'weekly', label: 'Every week', rule: { every: 1, unit: 'week' } },
  { id: 'monthly', label: 'Every month', rule: { every: 1, unit: 'month' } },
  { id: 'yearly', label: 'Every year', rule: { every: 1, unit: 'year' } },
]

const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function sameRule(a, b) {
  if (!a || !b) return a === b
  return a.every === b.every && a.unit === b.unit && sortedDays(a).join() === sortedDays(b).join()
}

const sortedDays = (rule) => [...(rule.weekdays ?? [])].sort((x, y) => x - y)

// "Daily", "Weekdays", "Every 2 weeks on Mon, Thu", "Monthly"
export function describeRepeat(rule) {
  if (!rule) return ''
  const days = sortedDays(rule)
  if (rule.unit === 'week' && rule.every === 1 && days.join() === '1,2,3,4,5') return 'Weekdays'
  const base =
    rule.every === 1
      ? { day: 'Daily', week: 'Weekly', month: 'Monthly', year: 'Yearly' }[rule.unit]
      : `Every ${rule.every} ${rule.unit}s`
  if (rule.unit === 'week' && days.length) return `${base} on ${days.map((d) => DAY_SHORT[d]).join(', ')}`
  return base
}

function addMonthsClamped(date, months, day) {
  const target = new Date(date.getFullYear(), date.getMonth() + months, 1)
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate()
  target.setDate(Math.min(day, lastDay))
  return target
}

// Pins month/year rules to the due date's day of the month
export function withAnchorDay(rule, dueKey) {
  if (!rule || !dueKey || (rule.unit !== 'month' && rule.unit !== 'year')) return rule
  return rule.day ? rule : { ...rule, day: fromKey(dueKey).getDate() }
}

// Week number counted from a fixed Monday, so "every 2 weeks" stays in step
const weekIndex = (date) => Math.floor((Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86400000 + 3) / 7)

// Is `date` an occurrence of the rule anchored at `anchor`?
function matches(rule, anchor, date) {
  const every = Math.max(1, rule.every)
  switch (rule.unit) {
    case 'day':
      return Math.round((date - anchor) / 86400000) % every === 0
    case 'week': {
      if ((weekIndex(date) - weekIndex(anchor)) % every !== 0) return false
      return rule.weekdays?.length ? rule.weekdays.includes(date.getDay()) : date.getDay() === anchor.getDay()
    }
    default:
      return false
  }
}

// The first occurrence strictly after `afterKey`, for a rule anchored at `anchorKey`.
export function nextOccurrence(rule, anchorKey, afterKey) {
  const anchor = fromKey(anchorKey)
  const after = fromKey(afterKey)

  if (rule.unit === 'month' || rule.unit === 'year') {
    const step = Math.max(1, rule.every) * (rule.unit === 'year' ? 12 : 1)
    for (let k = 0; ; k += step) {
      const d = addMonthsClamped(anchor, k, rule.day ?? anchor.getDate())
      if (d > after) return toKey(d)
    }
  }

  // Day/week rules: walk forward day by day (bounded to ~10 years)
  let d = addDays(after, 1)
  if (d < anchor) d = anchor
  for (let i = 0; i < 3700; i++, d = addDays(d, 1)) {
    if (matches(rule, anchor, d)) return toKey(d)
  }
  return null
}

// First due date for a new repeating task: today if it fits the rule, else the next match.
export function firstOccurrence(rule, todayKey) {
  if (rule.unit === 'week' && rule.weekdays?.length) {
    // The next matching weekday; "every N weeks" then counts from that date
    const today = fromKey(todayKey)
    for (let i = 0; i < 7; i++) {
      const d = addDays(today, i)
      if (rule.weekdays.includes(d.getDay())) return toKey(d)
    }
  }
  return todayKey
}

// When a repeating task is completed: the next due date after both its current
// due date and today (so an overdue daily task moves to tomorrow, not yesterday+1).
export function nextDueAfterCompletion(task, todayKey) {
  const due = task.due ?? todayKey
  const after = due > todayKey ? due : todayKey
  return nextOccurrence(task.repeat, due, after)
}
