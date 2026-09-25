export const PRIORITY_OPTIONS = [
  { value: 3, label: 'High', ring: 'border-red-500', fill: 'bg-red-500', text: 'text-red-600 dark:text-red-400' },
  { value: 2, label: 'Medium', ring: 'border-amber-500', fill: 'bg-amber-500', text: 'text-amber-600 dark:text-amber-400' },
  { value: 1, label: 'Low', ring: 'border-sky-500', fill: 'bg-sky-500', text: 'text-sky-600 dark:text-sky-400' },
  { value: 0, label: 'None', ring: 'border-slate-300 dark:border-slate-600', fill: 'bg-slate-400', text: 'text-slate-500 dark:text-slate-400' },
]

export const priorityStyle = (value) =>
  PRIORITY_OPTIONS.find((p) => p.value === value) ?? PRIORITY_OPTIONS[3]
