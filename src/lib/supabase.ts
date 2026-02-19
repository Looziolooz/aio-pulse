// PATH: src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'
import { type NextRequest, NextResponse } from 'next/server'

const supabaseUrl = process.env['NEXT_PUBLIC_SUPABASE_URL']!
const supabaseAnonKey = process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!
const supabaseServiceKey = process.env['SUPABASE_SERVICE_KEY']!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase env variables. Check your .env.local file.')
}

// ─── Browser client (anon key, RLS enabled) ───────────────────────────────────
// Import this in client components and browser-side code only.
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: true, autoRefreshToken: true },
})

// ─── Server client (service key, bypasses RLS) ────────────────────────────────
// Import ONLY inside API routes (src/app/api/**).
// Never use in client components — the service key must never reach the browser.
export function createServerClient() {
  if (!supabaseServiceKey) {
    throw new Error('SUPABASE_SERVICE_KEY is not set. Add it to .env.local')
  }
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

// ─── AuthError ────────────────────────────────────────────────────────────────
// Thrown by getCurrentUserId when auth fails.
// withAuthError() catches this and returns the correct HTTP 401 response.
export class AuthError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number = 401,
  ) {
    super(message)
    this.name = 'AuthError'
  }
}

// ─── getCurrentUserId ─────────────────────────────────────────────────────────
//
// Returns the authenticated user ID for an API route request.
//
// ╔═══════════════════════════════════════════════════════════════╗
// ║  DEVELOPMENT MODE (local)                                     ║
// ║  Set DEV_USER_ID=any-string in .env.local                     ║
// ║  → Auth is skipped, that string is always returned.           ║
// ║  Remove DEV_USER_ID before deploying to production.           ║
// ╠═══════════════════════════════════════════════════════════════╣
// ║  PRODUCTION MODE                                              ║
// ║  The client must send: Authorization: Bearer <supabase_jwt>   ║
// ║  → JWT is verified against your Supabase project secret.      ║
// ║  → Real user ID (UUID) is returned.                           ║
// ╚═══════════════════════════════════════════════════════════════╝
//
// Usage in every API route:
//   const userId = await getCurrentUserId(req.headers.get('authorization'))
//
export async function getCurrentUserId(authHeader?: string | null): Promise<string> {
  // ── Dev shortcut ──────────────────────────────────────────────────────────
  const devId = process.env['DEV_USER_ID']
  if (devId && devId.trim().length > 0) {
    return devId.trim()
  }

  // ── Production: extract and verify JWT ───────────────────────────────────
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AuthError('Missing or malformed Authorization header', 401)
  }

  const token = authHeader.replace('Bearer ', '').trim()
  if (!token) {
    throw new AuthError('Empty bearer token', 401)
  }

  // supabase.auth.getUser() validates the JWT signature server-side.
  const { data, error } = await supabase.auth.getUser(token)
  if (error || !data.user) {
    throw new AuthError('Invalid or expired token', 401)
  }

  return data.user.id
}

// ─── withAuthError ────────────────────────────────────────────────────────────
// Wraps an API route handler so AuthError is converted to a 401 JSON response
// automatically, instead of crashing with a 500.
//
// Usage (optional but recommended):
//
//   export const GET = withAuthError(async (req) => {
//     const userId = await getCurrentUserId(req.headers.get('authorization'))
//     // ... your logic
//   })
//
type RouteHandler = (req: NextRequest, ctx?: unknown) => Promise<NextResponse>

export function withAuthError(handler: RouteHandler): RouteHandler {
  return async (req, ctx) => {
    try {
      return await handler(req, ctx)
    } catch (err) {
      if (err instanceof AuthError) {
        return NextResponse.json(
          { success: false, message: err.message },
          { status: err.statusCode },
        )
      }
      throw err
    }
  }
}

// ─── getDevUserId ─────────────────────────────────────────────────────────────
// Convenience helper used only in seed scripts and tests.
export function getDevUserId(): string {
  return process.env['DEV_USER_ID'] ?? 'dev-user-local-001'
}
