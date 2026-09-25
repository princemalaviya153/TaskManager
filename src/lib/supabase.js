import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isConfigured = Boolean(url && anonKey)

// The session is kept in localStorage, so the app stays signed in and opens offline.
export const supabase = isConfigured ? createClient(url, anonKey) : null
