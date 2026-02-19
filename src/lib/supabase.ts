import { createClient } from '@supabase/supabase-js'
import { type NextRequest, NextResponse } from 'next/server'

const supabaseUrl = process.env['NEXT_PUBLIC_SUPABASE_URL']
const supabaseAnonKey = process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']
const supabaseServiceKey = process.env['SUPABASE_SERVICE_KEY']

const isConfigured = !!supabaseUrl && !!supabaseAnonKey

if (!isConfigured && process.env.NODE_ENV === 'production') {
  console.warn('⚠️ Warning: Supabase environment variables are missing in production.')
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder',
  {
    auth: { persistSession: true, autoRefreshToken: true },
  },
)

export function createServerClient() {
  if (!supabaseServiceKey || !supabaseUrl) {
    throw new Error('SUPABASE_SERVICE_KEY is not set. Check your Vercel variables.')
  }
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

export class AuthError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number = 401,
  ) {
    super(message)
    this.name = 'AuthError'
  }
}

export async function getCurrentUserId(authHeader?: string | null): Promise<string> {
  // DEV bypass: SOLO in development, mai in production
  if (process.env.NODE_ENV !== 'production') {
    const devId = process.env['DEV_USER_ID']
    if (devId?.trim()) return devId.trim()
  }

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AuthError('Missing or malformed Authorization header', 401)
  }

  const token = authHeader.replace('Bearer ', '').trim()
  const { data, error } = await supabase.auth.getUser(token)

  if (error || !data.user) {
    throw new AuthError('Invalid or expired token', 401)
  }

  return data.user.id
}

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