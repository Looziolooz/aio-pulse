import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerClient, getCurrentUserId } from '@/lib/supabase'

const alertSchema = z.object({
  brand_id: z.string().uuid(),
  name: z.string().min(1).max(100),
  type: z.enum(['mention_new', 'mention_lost', 'sentiment_drop', 'sentiment_spike', 'competitor_ahead', 'hallucination', 'visibility_change']),
  condition: z.object({
    threshold: z.number().optional(),
    operator: z.enum(['gt', 'lt', 'gte', 'lte', 'eq']).optional(),
    engine: z.string().optional(),
    competitor: z.string().optional(),
    sentiment: z.string().optional(),
  }),
  channels: z.array(z.string()).default(['email']),
  email: z.string().email().optional().nullable(),
  webhook_url: z.string().url().optional().nullable(),
})

// ─── Alert Rules ──────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const userId = await getCurrentUserId(req.headers.get('authorization'))
  const db = createServerClient()
  const { searchParams } = new URL(req.url)
  const brandId = searchParams.get('brand_id')
  const type = searchParams.get('type') // 'rules' | 'events'

  if (type === 'events') {
    let query = db
      .from('alert_events')
      .select('*, brand:brands(name, color)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(100)

    if (brandId) query = query.eq('brand_id', brandId)

    const { data, error } = await query
    if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 })
    return NextResponse.json({ success: true, data, timestamp: Date.now() })
  }

  // Default: return rules
  let query = db
    .from('alert_rules')
    .select('*, brand:brands(name, color, slug)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (brandId) query = query.eq('brand_id', brandId)

  const { data, error } = await query
  if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  return NextResponse.json({ success: true, data, timestamp: Date.now() })
}

export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId(req.headers.get('authorization'))
  const db = createServerClient()

  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ success: false, message: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = alertSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, message: 'Validation failed', details: parsed.error.flatten().fieldErrors },
      { status: 422 },
    )
  }

  // Verify brand ownership
  const { data: brand } = await db
    .from('brands')
    .select('id')
    .eq('id', parsed.data.brand_id)
    .eq('user_id', userId)
    .single()

  if (!brand) return NextResponse.json({ success: false, message: 'Brand not found' }, { status: 404 })

  const { data, error } = await db
    .from('alert_rules')
    .insert({ ...parsed.data, user_id: userId })
    .select()
    .single()

  if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  return NextResponse.json({ success: true, data, timestamp: Date.now() }, { status: 201 })
}

export async function PUT(req: NextRequest) {
  const userId = await getCurrentUserId(req.headers.get('authorization'))
  const db = createServerClient()
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  const action = searchParams.get('action') // 'read' | 'toggle'

  if (!id) return NextResponse.json({ success: false, message: 'id required' }, { status: 400 })

  if (action === 'read') {
    // Mark alert event as read
    const { error } = await db
      .from('alert_events')
      .update({ is_read: true })
      .eq('id', id)
      .eq('user_id', userId)
    if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 })
    return NextResponse.json({ success: true, data: null, timestamp: Date.now() })
  }

  if (action === 'toggle') {
    const { data: rule } = await db
      .from('alert_rules')
      .select('is_active')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    const { data, error } = await db
      .from('alert_rules')
      .update({ is_active: !rule?.is_active })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 })
    return NextResponse.json({ success: true, data, timestamp: Date.now() })
  }

  // Full update
  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ success: false, message: 'Invalid JSON' }, { status: 400 })
  }

  const { data, error } = await db
    .from('alert_rules')
    .update(body as Record<string, unknown>)
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  return NextResponse.json({ success: true, data, timestamp: Date.now() })
}

export async function DELETE(req: NextRequest) {
  const userId = await getCurrentUserId(req.headers.get('authorization'))
  const db = createServerClient()
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  const type = searchParams.get('type') // 'rule' | 'event'

  if (!id) return NextResponse.json({ success: false, message: 'id required' }, { status: 400 })

  const table = type === 'event' ? 'alert_events' : 'alert_rules'
  const { error } = await db.from(table).delete().eq('id', id).eq('user_id', userId)

  if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  return NextResponse.json({ success: true, data: null, timestamp: Date.now() })
}
