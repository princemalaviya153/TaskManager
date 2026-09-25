import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function AuthScreen() {
  const [mode, setMode] = useState('signin') // 'signin' | 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [sentTo, setSentTo] = useState('')

  const signup = mode === 'signup'

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      if (signup) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        })
        if (error) throw error
        // No session means Supabase wants the email confirmed first
        if (!data.session) setSentTo(email)
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      }
    } catch (err) {
      setError(friendlyError(err))
    } finally {
      setBusy(false)
    }
  }

  const input =
    'w-full rounded-xl bg-slate-100 px-3 py-3 text-base outline-none ring-indigo-500 focus:ring-2 dark:bg-slate-800'

  return (
    <div className="flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <img src="/icon.svg" alt="" className="mx-auto mb-4 size-14" />
          <h1 className="text-2xl font-bold tracking-tight">TaskManager</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Your tasks, synced across phone and computer.</p>
        </div>

        {sentTo ? (
          <div className="rounded-2xl bg-white p-6 text-center shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
            <p className="font-medium">Check your email</p>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              We sent a confirmation link to <span className="font-medium text-slate-700 dark:text-slate-200">{sentTo}</span>.
              Open it to activate your account, then sign in here.
            </p>
            <button
              type="button"
              onClick={() => {
                setSentTo('')
                setMode('signin')
              }}
              className="mt-5 w-full rounded-xl bg-indigo-600 py-3 font-medium text-white hover:bg-indigo-500"
            >
              Back to sign in
            </button>
          </div>
        ) : (
          <form
            onSubmit={submit}
            className="space-y-3 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800"
          >
            <h2 className="text-lg font-semibold">{signup ? 'Create your account' : 'Sign in'}</h2>
            <input
              type="email"
              required
              autoComplete="email"
              placeholder="Email"
              aria-label="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={input}
            />
            <input
              type="password"
              required
              minLength={6}
              autoComplete={signup ? 'new-password' : 'current-password'}
              placeholder={signup ? 'Password (at least 6 characters)' : 'Password'}
              aria-label="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
              {busy ? 'Please wait…' : signup ? 'Create account' : 'Sign in'}
            </button>
            <p className="pt-1 text-center text-sm text-slate-500 dark:text-slate-400">
              {signup ? 'Already have an account?' : 'New here?'}{' '}
              <button
                type="button"
                onClick={() => {
                  setMode(signup ? 'signin' : 'signup')
                  setError('')
                }}
                className="font-medium text-indigo-600 hover:underline dark:text-indigo-400"
              >
                {signup ? 'Sign in' : 'Create an account'}
              </button>
            </p>
          </form>
        )}
      </div>
    </div>
  )
}

function friendlyError(err) {
  const msg = err?.message ?? ''
  if (!navigator.onLine) return "You're offline. Connect to the internet to sign in."
  if (/invalid login credentials/i.test(msg)) return 'Wrong email or password.'
  if (/email not confirmed/i.test(msg)) return 'Please confirm your email first — check your inbox for the link.'
  if (/already registered/i.test(msg)) return 'An account with this email already exists. Try signing in.'
  if (/rate limit/i.test(msg)) return 'Too many attempts. Please wait a few minutes and try again.'
  return msg || 'Something went wrong. Please try again.'
}
