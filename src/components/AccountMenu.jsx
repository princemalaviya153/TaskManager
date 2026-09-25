import { useEffect, useRef, useState } from 'react'

const STATUS = {
  synced: { dot: 'bg-emerald-500', label: 'All changes saved' },
  syncing: { dot: 'bg-amber-400 animate-pulse', label: 'Saving…' },
  offline: { dot: 'bg-slate-400', label: "Offline — changes will sync when you're back online" },
  error: { dot: 'bg-red-500', label: "Couldn't sync — retrying automatically" },
}

export default function AccountMenu({ email, status, onSignOut }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const s = STATUS[status] ?? STATUS.syncing

  useEffect(() => {
    if (!open) return
    const close = (e) => {
      if (e.type === 'keydown' ? e.key === 'Escape' : !ref.current?.contains(e.target)) setOpen(false)
    }
    document.addEventListener('pointerdown', close)
    document.addEventListener('keydown', close)
    return () => {
      document.removeEventListener('pointerdown', close)
      document.removeEventListener('keydown', close)
    }
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label={`Account and sync: ${s.label}`}
        title={s.label}
        className="relative grid size-10 place-items-center rounded-full bg-indigo-100 font-semibold text-indigo-700 uppercase hover:bg-indigo-200 dark:bg-indigo-950 dark:text-indigo-300 dark:hover:bg-indigo-900"
      >
        {email?.[0] ?? '?'}
        <span className={`absolute right-0 bottom-0 size-3 rounded-full ring-2 ring-slate-50 dark:ring-slate-950 ${s.dot}`} />
      </button>

      {open && (
        <div className="absolute right-0 z-40 mt-2 w-64 rounded-2xl bg-white p-2 shadow-lg ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
          <div className="px-3 py-2">
            <p className="truncate text-sm font-medium">{email}</p>
            <p className="mt-1 flex items-start gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span className={`mt-1 size-2 shrink-0 rounded-full ${s.dot}`} />
              {s.label}
            </p>
          </div>
          <button
            type="button"
            onClick={onSignOut}
            className="w-full rounded-xl px-3 py-2 text-left text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  )
}
