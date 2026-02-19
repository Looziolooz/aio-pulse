import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env['NEXT_PUBLIC_SUPABASE_URL']!
const supabaseAnonKey = process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!
const supabaseServiceKey = process.env['SUPABASE_SERVICE_KEY']!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Check your .env.local file.')
}

// ─── Browser client (anon key, RLS enabled) ───────────────────────────────────
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: true, autoRefreshToken: true },
})

// ─── Server client (service key, bypasses RLS) ────────────────────────────────
// Use ONLY in API routes — never expose to client
export function createServerClient() {
  if (!supabaseServiceKey) {
    throw new Error('SUPABASE_SERVICE_KEY is not set. Add it to .env.local')
  }
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

// ─── Dev user helper ──────────────────────────────────────────────────────────
// Returns a mock user ID for local development without auth
export function getDevUserId(): string {
  return process.env['DEV_USER_ID'] ?? 'dev-user-local-001'
}

// ─── Get current user ID (API routes) ────────────────────────────────────────
// In production, extract from JWT. For dev, returns DEV_USER_ID.
export async function getCurrentUserId(_authHeader?: string | null): Promise<string> {
  // TODO: In production, verify JWT and return real user ID:
  // const { data: { user } } = await supabase.auth.getUser(token)
  // return user?.id ?? ''
  return getDevUserId()
}
