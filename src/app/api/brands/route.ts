// PATH: src/app/api/brands/route.ts
import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerClient, getCurrentUserId, AuthError } from '@/lib/supabase'
import { slugify } from '@/lib/utils'

// ─── Validation ───────────────────────────────────────────────────────────────

const brandSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  domain: z.string().max(200).optional(),
  aliases: z.array(z.string().max(100)).max(10).optional().default([]),
  domains: z.array(z.string().max(200)).max(20).optional().default([]),
  competitors: z.array(z.string().max(100)).max(20).optional().default([]),
  industry: z.string().max(100).optional(),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, 'Must be a valid hex color')
    .optional()
    .default('#6366f1'),
})

function err(message: string, status = 500) {
  return NextResponse.json({ success: false, message }, { status })
}

// ─── GET /api/brands ──────────────────────────────────────────────────────────
// Returns all brands belonging to the authenticated user.
export async function GET(req: NextRequest) {
  let userId: string
  try {
    userId = await getCurrentUserId(req.headers.get('authorization'))
  } catch (e) {
    if (e instanceof AuthError)
      return NextResponse.json({ success: false, message: e.message }, { status: 401 })
    return err('Authentication failed')
  }

  const db = createServerClient()
  const { data, error } = await db
    .from('brands')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) return err(error.message)
  return NextResponse.json({ success: true, data, timestamp: Date.now() })
}

// ─── POST /api/brands ─────────────────────────────────────────────────────────
// Creates a new brand.
export async function POST(req: NextRequest) {
  let userId: string
  try {
    userId = await getCurrentUserId(req.headers.get('authorization'))
  } catch (e) {
    if (e instanceof AuthError)
      return NextResponse.json({ success: false, message: e.message }, { status: 401 })
    return err('Authentication failed')
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return err('Invalid JSON body', 400)
  }

  const parsed = brandSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        message: 'Validation failed',
        details: parsed.error.flatten().fieldErrors,
      },
      { status: 422 },
    )
  }

  const slug = slugify(parsed.data.name)
  const db = createServerClient()

  const { data, error } = await db
    .from('brands')
    .insert({ ...parsed.data, user_id: userId, slug })
    .select()
    .single()

  if (error) {
    // Supabase returns 23505 for unique constraint violations (duplicate slug)
    if (error.code === '23505') {
      return err('A brand with this name already exists', 409)
    }
    return err(error.message)
  }

  return NextResponse.json({ success: true, data, timestamp: Date.now() }, { status: 201 })
}
