// PATH: src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'
import { type NextRequest, NextResponse } from 'next/server'

const supabaseUrl = process.env['NEXT_PUBLIC_SUPABASE_URL']
const supabaseAnonKey = process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']
const supabaseServiceKey = process.env['SUPABASE_SERVICE_KEY']

// Verifichiamo la configurazione senza bloccare il processo di build su Vercel.
// Se le chiavi mancano, logghiamo un avviso invece di lanciare un errore fatale.
const isConfigured = !!supabaseUrl && !!supabaseAnonKey

if (!isConfigured && process.env.NODE_ENV === 'production') {
  console.warn('⚠️ Warning: Supabase environment variables are missing in production.')
}

// ─── Browser client (anon key, RLS enabled) ───────────────────────────────────
// Inizializzato con valori placeholder se mancano le chiavi per evitare crash durante il pre-rendering.
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder',
  {
    auth: { persistSession: true, autoRefreshToken: true },
  },
)

// ─── Server client (service key, bypasses RLS) ────────────────────────────────
export function createServerClient() {
  if (!supabaseServiceKey || !supabaseUrl) {
    throw new Error('SUPABASE_SERVICE_KEY or URL is not set. Check your environment variables.')
  }
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

// ─── AuthError ────────────────────────────────────────────────────────────────
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
export async function getCurrentUserId(authHeader?: string | null): Promise<string> {
  // ── Dev shortcut (solo se DEV_USER_ID è esplicitamente impostato in .env) ──
  const devId = process.env['DEV_USER_ID']
  if (devId && devId.trim().length > 0) {
    return devId.trim()
  }

  // ── Production: estrazione e verifica del JWT ─────────────────────────────
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AuthError('Missing or malformed Authorization header', 401)
  }

  const token = authHeader.replace('Bearer ', '').trim()
  if (!token) {
    throw new AuthError('Empty bearer token', 401)
  }

  // supabase.auth.getUser(token) valida la firma del JWT lato server.
  const { data, error } = await supabase.auth.getUser(token)
  if (error || !data.user) {
    throw new AuthError('Invalid or expired token', 401)
  }

  return data.user.id
}

// ─── withAuthError ────────────────────────────────────────────────────────────
interface RouteContext {
  params: Record<string, string | string[] | undefined>
}

type RouteHandler = (req: NextRequest, ctx: RouteContext) => Promise<NextResponse>

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
      console.error('[Unhandled API Error]:', err)
      return NextResponse.json(
        { success: false, message: 'An unexpected error occurred' },
        { status: 500 },
      )
    }
  }
}

// ─── getDevUserId ─────────────────────────────────────────────────────────────
export function getDevUserId(): string {
  return process.env['DEV_USER_ID'] ?? 'dev-user-local-001'
}