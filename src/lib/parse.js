import { addDays, toKey } from './dates.js'

// Parses quick-add text like "Call dentist tomorrow 3pm #health !high"
// into { title, due, time, priority, tags }.
//
// Supported tokens:
//   dates:     today, tonight, tomorrow/tmr, yesterday, monday..sunday (mon..sun), next week,
//              in 3 days / in 2 weeks, 2026-10-05, 5 oct / oct 5
//   times:     3pm, 3:30pm, at 15:00
//   priority:  !high !h !1 · !medium !med !m !2 · !low !l !3
//   tags:      #work #home

export const PRIORITY = { NONE: 0, LOW: 1, MEDIUM: 2, HIGH: 3 }

const PRIORITY_WORDS = {
  high: 3, h: 3, 1: 3,
  medium: 2, med: 2, m: 2, 2: 2,
  low: 1, l: 1, 3: 1,
}

const WEEKDAYS = {
  sunday: 0, sun: 0,
  monday: 1, mon: 1,
  tuesday: 2, tue: 2, tues: 2,
  wednesday: 3, wed: 3,
  thursday: 4, thu: 4, thur: 4, thurs: 4,
  friday: 5, fri: 5,
  saturday: 6, sat: 6,
}

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']
const MONTH_RE = '(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|june?|july?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)'

// Given a month/day with no year, pick the next occurrence (this year or next).
function upcomingDate(monthIndex, day, now) {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  let d = new Date(now.getFullYear(), monthIndex, day)
  if (d.getMonth() !== monthIndex) return null // e.g. Feb 31
  if (d < today) d = new Date(now.getFullYear() + 1, monthIndex, day)
  return toKey(d)
}

const DATE_RULES = [
  [/\b(?:today|tonight)\b/i, (_m, now) => toKey(now)],
  [/\b(?:tomorrow|tmrw?)\b/i, (_m, now) => toKey(addDays(now, 1))],
  [/\byesterday\b/i, (_m, now) => toKey(addDays(now, -1))],
  [/\bnext week\b/i, (_m, now) => toKey(addDays(now, ((8 - now.getDay()) % 7) || 7))], // next Monday
  [/\bin (\d{1,3}) (day|days|week|weeks)\b/i, (m, now) => toKey(addDays(now, Number(m[1]) * (m[2].startsWith('week') ? 7 : 1)))],
  [/\b(\d{4})-(\d{2})-(\d{2})\b/, (m) => `${m[1]}-${m[2]}-${m[3]}`],
  [new RegExp(`\\b(\\d{1,2})(?:st|nd|rd|th)? ${MONTH_RE}\\b`, 'i'), (m, now) => upcomingDate(MONTHS.indexOf(m[2].slice(0, 3).toLowerCase()), Number(m[1]), now)],
  [new RegExp(`\\b${MONTH_RE} (\\d{1,2})(?:st|nd|rd|th)?\\b`, 'i'), (m, now) => upcomingDate(MONTHS.indexOf(m[1].slice(0, 3).toLowerCase()), Number(m[2]), now)],
  [/\b(?:next )?(sunday|monday|tuesday|wednesday|thursday|friday|saturday|sun|mon|tues?|wed|thu(?:rs?)?|fri|sat)\b/i, (m, now) => {
    // Always the *next* occurrence: "friday" said on a Friday means next week.
    const target = WEEKDAYS[m[1].toLowerCase()]
    return toKey(addDays(now, ((target - now.getDay() + 7) % 7) || 7))
  }],
]

export function parseQuickAdd(input, now = new Date()) {
  let text = ` ${input} `
  const result = { title: '', due: null, time: null, priority: PRIORITY.NONE, tags: [] }

  const strip = (match) => {
    text = text.slice(0, match.index) + ' ' + text.slice(match.index + match[0].length)
  }

  // Tags
  text = text.replace(/(\s)#([\p{L}\p{N}_-]+)(?=\s)/gu, (_all, space, tag) => {
    const t = tag.toLowerCase()
    if (!result.tags.includes(t)) result.tags.push(t)
    return space
  })

  // Priority
  const pr = text.match(/\s!(high|medium|med|low|h|m|l|[123])(?=\s)/i)
  if (pr) {
    result.priority = PRIORITY_WORDS[pr[1].toLowerCase()]
    strip(pr)
  }

  // Time: 12-hour first, then 24-hour
  let tm = text.match(/\s(?:at )?(\d{1,2})(?::([0-5]\d))? ?(am|pm)(?=\s)/i)
  if (tm && Number(tm[1]) >= 1 && Number(tm[1]) <= 12) {
    let h = Number(tm[1]) % 12
    if (tm[3].toLowerCase() === 'pm') h += 12
    result.time = `${String(h).padStart(2, '0')}:${tm[2] ?? '00'}`
    strip(tm)
  } else {
    tm = text.match(/\s(?:at )?([01]?\d|2[0-3]):([0-5]\d)(?=\s)/)
    if (tm) {
      result.time = `${tm[1].padStart(2, '0')}:${tm[2]}`
      strip(tm)
    }
  }

  // Date: first rule that matches wins
  for (const [re, toDue] of DATE_RULES) {
    const m = text.match(re)
    if (!m) continue
    const due = toDue(m, now)
    if (!due) continue
    result.due = due
    // Also drop a leading "on"/"by"/"due" ("call mom on friday")
    const before = text.slice(0, m.index)
    const lead = before.match(/\s(?:on|by|due)\s$/i)
    const start = lead ? m.index - lead[0].length + 1 : m.index
    text = text.slice(0, start) + ' ' + text.slice(m.index + m[0].length)
    break
  }

  // A time with no date means today
  if (result.time && !result.due) result.due = toKey(now)

  result.title = text.replace(/\s+/g, ' ').trim() || input.trim()
  return result
}
