import { useEffect, useState } from 'react'
import { isConfigured, supabase } from './lib/supabase'
import App from './App'
import AuthScreen from './components/AuthScreen'
import SetPasswordScreen from './components/SetPasswordScreen'

export default function Root() {
  // undefined = still checking for a saved session
  const [session, setSession] = useState(undefined)
  // Opened from a "reset password" email link
  const [recovering, setRecovering] = useState(false)

  useEffect(() => {
    if (!isConfigured) return
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s)
      if (event === 'PASSWORD_RECOVERY') setRecovering(true)
    })
    return () => data.subscription.unsubscribe()
  }, [])

  if (!isConfigured) {
    return (
      <div className="flex min-h-dvh items-center justify-center p-6 text-center">
        <p className="max-w-sm text-sm text-slate-500">
          Supabase isn't configured. Set <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> in <code>.env</code> and restart.
        </p>
      </div>
    )
  }
  if (session === undefined) return null
  if (!session) return <AuthScreen />
  if (recovering) return <SetPasswordScreen onDone={() => setRecovering(false)} />
  // Keyed by user so switching accounts starts from a clean state
  return <App key={session.user.id} user={session.user} />
}
