// PATH: src/app/api/brands/[id]/route.ts
import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerClient, getCurrentUserId, AuthError } from '@/lib/supabase'

// ─── Validation ───────────────────────────────────────────────────────────────

const updateBrandSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional().nullable(),
  domain: z.string().max(200).optional().nullable(),
  aliases: z.array(z.string().max(100)).max(10).optional(),
  domains: z.array(z.string().max(200)).max(20).optional(),
  competitors: z.array(z.string().max(100)).max(20).optional(),
  industry: z.string().max(100).optional().nullable(),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .optional(),
  is_active: z.boolean().optional(),
})

interface Params {
  params: { id: string }
}

function err(message: string, status = 500) {
  return NextResponse.json({ success: false, message }, { status })
}

// ─── GET /api/brands/[id] ─────────────────────────────────────────────────────
export async function GET(req: NextRequest, { params }: Params) {
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
    .eq('id', params.id)
    .eq('user_id', userId)
    .single()

  if (error || !data) return err('Brand not found', 404)
  return NextResponse.json({ success: true, data, timestamp: Date.now() })
}

// ─── PUT /api/brands/[id] ─────────────────────────────────────────────────────
export async function PUT(req: NextRequest, { params }: Params) {
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

  const parsed = updateBrandSchema.safeParse(body)
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

  const db = createServerClient()
  const { data, error } = await db
    .from('brands')
    .update(parsed.data)
    .eq('id', params.id)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) return err(error.message)
  if (!data) return err('Brand not found', 404)
  return NextResponse.json({ success: true, data, timestamp: Date.now() })
}

// ─── DELETE /api/brands/[id] ──────────────────────────────────────────────────
export async function DELETE(req: NextRequest, { params }: Params) {
  let userId: string
  try {
    userId = await getCurrentUserId(req.headers.get('authorization'))
  } catch (e) {
    if (e instanceof AuthError)
      return NextResponse.json({ success: false, message: e.message }, { status: 401 })
    return err('Authentication failed')
  }

  const db = createServerClient()
  const { error } = await db
    .from('brands')
    .delete()
    .eq('id', params.id)
    .eq('user_id', userId)

  if (error) return err(error.message)
  return NextResponse.json({ success: true, data: null, timestamp: Date.now() })
}
