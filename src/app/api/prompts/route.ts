// PATH: src/app/api/prompts/route.ts
import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerClient, getCurrentUserId, AuthError } from '@/lib/supabase'

// ─── Validation ───────────────────────────────────────────────────────────────

const promptSchema = z.object({
  brand_id: z.string().uuid(),
  text: z.string().min(5).max(500),
  language: z.string().default('en'),
  market: z.string().default('global'),
  category: z
    .enum(['awareness', 'comparison', 'alternative', 'features', 'custom'])
    .optional(),
  engines: z
    .array(z.enum(['chatgpt', 'gemini', 'perplexity']))
    .min(1)
    .default(['chatgpt', 'gemini', 'perplexity']),
  run_frequency: z.enum(['hourly', 'daily', 'weekly']).default('daily'),
})

function err(message: string, status = 500) {
  return NextResponse.json({ success: false, message }, { status })
}

// ─── GET /api/prompts ─────────────────────────────────────────────────────────
// Returns prompts for the authenticated user.
// ?brand_id=uuid  → filter by brand
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
  const { searchParams } = new URL(req.url)
  const brandId = searchParams.get('brand_id')

  let query = db
    .from('prompts')
    .select('*, brand:brands(name, color, slug)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (brandId) query = query.eq('brand_id', brandId)

  const { data, error } = await query
  if (error) return err(error.message)
  return NextResponse.json({ success: true, data, timestamp: Date.now() })
}

// ─── POST /api/prompts ────────────────────────────────────────────────────────
// Creates a new prompt.
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

  const parsed = promptSchema.safeParse(body)
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

  // Verify that the referenced brand belongs to this user
  const { data: brand } = await db
    .from('brands')
    .select('id')
    .eq('id', parsed.data.brand_id)
    .eq('user_id', userId)
    .single()

  if (!brand) return err('Brand not found or access denied', 404)

  const { data, error } = await db
    .from('prompts')
    .insert({ ...parsed.data, user_id: userId })
    .select()
    .single()

  if (error) return err(error.message)
  return NextResponse.json({ success: true, data, timestamp: Date.now() }, { status: 201 })
}

// ─── DELETE /api/prompts ──────────────────────────────────────────────────────
// ?id=uuid → deletes the prompt
export async function DELETE(req: NextRequest) {
  let userId: string
  try {
    userId = await getCurrentUserId(req.headers.get('authorization'))
  } catch (e) {
    if (e instanceof AuthError)
      return NextResponse.json({ success: false, message: e.message }, { status: 401 })
    return err('Authentication failed')
  }

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return err('id query parameter is required', 400)

  const db = createServerClient()
  const { error } = await db
    .from('prompts')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)

  if (error) return err(error.message)
  return NextResponse.json({ success: true, data: null, timestamp: Date.now() })
}
