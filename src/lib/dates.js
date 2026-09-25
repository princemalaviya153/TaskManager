// Dates are stored as local "YYYY-MM-DD" keys so a task due "today" stays
// on today regardless of time zone conversions.

const pad = (n) => String(n).padStart(2, '0')

export function toKey(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function fromKey(key) {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function addDays(date, days) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  d.setDate(d.getDate() + days)
  return d
}

export function todayKey() {
  return toKey(new Date())
}

export function daysBetween(fromKeyStr, toKeyStr) {
  return Math.round((fromKey(toKeyStr) - fromKey(fromKeyStr)) / 86400000)
}

// "Today", "Tomorrow", "Yesterday", "Friday", "Sep 30", "Jan 5, 2027"
export function formatDay(key, today = todayKey()) {
  const diff = daysBetween(today, key)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Tomorrow'
  if (diff === -1) return 'Yesterday'
  const date = fromKey(key)
  if (diff > 1 && diff < 7) return date.toLocaleDateString(undefined, { weekday: 'long' })
  const sameYear = date.getFullYear() === fromKey(today).getFullYear()
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    ...(sameYear ? {} : { year: 'numeric' }),
  })
}

// "15:30" -> "3:30 PM" (respects the user's locale)
export function formatTime(time) {
  const [h, m] = time.split(':').map(Number)
  return new Date(2000, 0, 1, h, m).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
}

export function formatLongDate(key) {
  return fromKey(key).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })
}
