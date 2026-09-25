import { useState } from 'react'
import { supabase } from '../lib/supabase'

// Used after a "forgot password" email link, and from the account menu.
export default function SetPasswordScreen({ title = 'Set a new password', onDone, onCancel }) {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    if (password !== confirm) return setError("The passwords don't match.")
    setBusy(true)
    setError('')
    const { error } = await supabase.auth.updateUser({ password })
    setBusy(false)
    if (error) setError(error.message)
    else onDone()
  }

  const input =
    'w-full rounded-xl bg-slate-100 px-3 py-3 text-base outline-none ring-indigo-500 focus:ring-2 dark:bg-slate-800'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-50 px-4 py-10 dark:bg-slate-950">
      <form
        onSubmit={submit}
        className="w-full max-w-sm space-y-3 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800"
      >
        <h2 className="text-lg font-semibold">{title}</h2>
        <input
          type="password"
          required
          minLength={6}
          autoComplete="new-password"
          placeholder="New password (at least 6 characters)"
          aria-label="New password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={input}
          autoFocus
        />
        <input
          type="password"
          required
          minLength={6}
          autoComplete="new-password"
          placeholder="Repeat new password"
          aria-label="Repeat new password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className={input}
        />
        {error && (
          <p role="alert" className="text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-xl bg-indigo-600 py-3 font-medium text-white hover:bg-indigo-500 disabled:opacity-60"
        >
          {busy ? 'Saving…' : 'Save password'}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="w-full py-2 text-sm text-slate-500 hover:underline dark:text-slate-400">
            Cancel
          </button>
        )}
      </form>
    </div>
  )
}
