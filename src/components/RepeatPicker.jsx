import { REPEAT_PRESETS, sameRule } from '../lib/repeat'

const WEEKDAY_LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
const WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const UNITS = ['day', 'week', 'month', 'year']

// value: repeat rule or null
export default function RepeatPicker({ value, onChange }) {
  const custom = value ?? { every: 1, unit: 'week', weekdays: [] }

  const setCustom = (patch) => {
    const next = { ...custom, ...patch }
    if (next.unit !== 'week') delete next.weekdays
    delete next.day
    onChange(next)
  }

  const toggleDay = (d) => {
    const days = custom.weekdays ?? []
    setCustom({ weekdays: days.includes(d) ? days.filter((x) => x !== d) : [...days, d].sort() })
  }

  const chip = (selected) =>
    `rounded-full px-3 py-1 text-sm transition ${
      selected ? 'bg-indigo-600 text-white' : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700'
    }`

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5">
        <button type="button" onClick={() => onChange(null)} aria-pressed={!value} className={chip(!value)}>
          Never
        </button>
        {REPEAT_PRESETS.map((p) => {
          const selected = sameRule(value, p.rule)
          return (
            <button key={p.id} type="button" onClick={() => onChange(p.rule)} aria-pressed={selected} className={chip(selected)}>
              {p.label}
            </button>
          )
        })}
      </div>

      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="text-slate-500 dark:text-slate-400">Custom: every</span>
        <input
          type="number"
          min={1}
          max={365}
          inputMode="numeric"
          aria-label="Repeat interval"
          value={value ? custom.every : ''}
          placeholder="1"
          onChange={(e) => setCustom({ every: Math.min(365, Math.max(1, Number(e.target.value) || 1)) })}
          className="w-16 rounded-lg bg-slate-100 px-2 py-1 text-center outline-none ring-indigo-500 focus:ring-2 dark:bg-slate-800"
        />
        <select
          aria-label="Repeat unit"
          value={value ? custom.unit : ''}
          onChange={(e) => setCustom({ unit: e.target.value })}
          className="rounded-lg bg-slate-100 px-2 py-1 outline-none ring-indigo-500 focus:ring-2 dark:bg-slate-800 dark:[color-scheme:dark]"
        >
          {!value && <option value="">—</option>}
          {UNITS.map((u) => (
            <option key={u} value={u}>
              {custom.every > 1 ? `${u}s` : u}
            </option>
          ))}
        </select>
      </div>

      {value?.unit === 'week' && (
        <div className="flex gap-1" role="group" aria-label="Repeat on days">
          {WEEKDAY_LETTERS.map((letter, d) => {
            const on = custom.weekdays?.includes(d)
            return (
              <button
                key={d}
                type="button"
                onClick={() => toggleDay(d)}
                aria-pressed={on}
                aria-label={WEEKDAY_NAMES[d]}
                className={`grid size-9 place-items-center rounded-full text-sm font-medium transition ${
                  on ? 'bg-indigo-600 text-white' : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700'
                }`}
              >
                {letter}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
