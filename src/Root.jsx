import { useEffect, useState } from 'react'
import { isConfigured, supabase } from './lib/supabase'
import App from './App'
import AuthScreen from './components/AuthScreen'

export default function Root() {
  // undefined = still checking for a saved session
  const [session, setSession] = useState(undefined)

  useEffect(() => {
    if (!isConfigured) return
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data } = supabase.auth.onAuthStateChange((_event, s) => setSession(s))
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
  // Keyed by user so switching accounts starts from a clean state
  return <App key={session.user.id} user={session.user} />
}
