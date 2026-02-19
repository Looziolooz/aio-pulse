// PATH: src/app/api/alerts/route.ts
import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerClient, getCurrentUserId, AuthError } from '@/lib/supabase'

// ─── Validation schemas ───────────────────────────────────────────────────────

const alertConditionSchema = z.object({
  threshold: z.number().optional(),
  operator: z.enum(['gt', 'lt', 'gte', 'lte', 'eq']).optional(),
  engine: z.string().optional(),
  competitor: z.string().max(200).optional(),
  sentiment: z.string().optional(),
})

const createAlertSchema = z.object({
  brand_id: z.string().uuid(),
  name: z.string().min(1).max(100),
  type: z.enum([
    'mention_new',
    'mention_lost',
    'sentiment_drop',
    'sentiment_spike',
    'competitor_ahead',
    'hallucination',
    'visibility_change',
  ]),
  condition: alertConditionSchema,
  channels: z.array(z.string()).default(['email']),
  email: z.string().email().optional().nullable(),
  webhook_url: z.string().url().optional().nullable(),
})

// Partial schema for full update (PUT without action param)
const updateAlertSchema = createAlertSchema.partial().omit({ brand_id: true })

// ─── Helper: auth + db setup ──────────────────────────────────────────────────
async function setup(req: NextRequest) {
  const userId = await getCurrentUserId(req.headers.get('authorization'))
  const db = createServerClient()
  return { userId, db }
}

// ─── Helper: standard error response ─────────────────────────────────────────
function err(message: string, status = 500) {
  return NextResponse.json({ success: false, message }, { status })
}

// ─── GET /api/alerts ──────────────────────────────────────────────────────────
// ?type=rules    → returns alert rules for the user         (default)
// ?type=events   → returns alert events (notifications)
// ?brand_id=uuid → filter by brand
export async function GET(req: NextRequest) {
  let userId: string
  let db: ReturnType<typeof createServerClient>

  try {
    ;({ userId, db } = await setup(req))
  } catch (e) {
    if (e instanceof AuthError)
      return NextResponse.json({ success: false, message: e.message }, { status: 401 })
    return err('Authentication failed')
  }

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
    if (error) return err(error.message)
    return NextResponse.json({ success: true, data, timestamp: Date.now() })
  }

  // Default: return alert rules
  let query = db
    .from('alert_rules')
    .select('*, brand:brands(name, color, slug)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (brandId) query = query.eq('brand_id', brandId)

  const { data, error } = await query
  if (error) return err(error.message)
  return NextResponse.json({ success: true, data, timestamp: Date.now() })
}

// ─── POST /api/alerts ─────────────────────────────────────────────────────────
// Creates a new alert rule.
export async function POST(req: NextRequest) {
  let userId: string
  let db: ReturnType<typeof createServerClient>

  try {
    ;({ userId, db } = await setup(req))
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

  const parsed = createAlertSchema.safeParse(body)
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

  // Verify brand ownership — prevent users from attaching rules to other users' brands
  const { data: brand } = await db
    .from('brands')
    .select('id')
    .eq('id', parsed.data.brand_id)
    .eq('user_id', userId)
    .single()

  if (!brand) {
    return err('Brand not found or access denied', 404)
  }

  const { data, error } = await db
    .from('alert_rules')
    .insert({ ...parsed.data, user_id: userId })
    .select()
    .single()

  if (error) return err(error.message)
  return NextResponse.json({ success: true, data, timestamp: Date.now() }, { status: 201 })
}

// ─── PUT /api/alerts ──────────────────────────────────────────────────────────
// ?id=uuid&action=read    → mark alert event as read
// ?id=uuid&action=toggle  → toggle alert rule is_active
// ?id=uuid                → full update of an alert rule (body validated with Zod)
export async function PUT(req: NextRequest) {
  let userId: string
  let db: ReturnType<typeof createServerClient>

  try {
    ;({ userId, db } = await setup(req))
  } catch (e) {
    if (e instanceof AuthError)
      return NextResponse.json({ success: false, message: e.message }, { status: 401 })
    return err('Authentication failed')
  }

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  const action = searchParams.get('action') // 'read' | 'toggle'

  if (!id) return err('id query parameter is required', 400)

  // ── Mark event as read ────────────────────────────────────────────────────
  if (action === 'read') {
    const { error } = await db
      .from('alert_events')
      .update({ is_read: true })
      .eq('id', id)
      .eq('user_id', userId)

    if (error) return err(error.message)
    return NextResponse.json({ success: true, data: null, timestamp: Date.now() })
  }

  // ── Toggle rule active/paused ─────────────────────────────────────────────
  if (action === 'toggle') {
    const { data: rule } = await db
      .from('alert_rules')
      .select('is_active')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (!rule) return err('Alert rule not found', 404)

    const { data, error } = await db
      .from('alert_rules')
      .update({ is_active: !rule.is_active })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) return err(error.message)
    return NextResponse.json({ success: true, data, timestamp: Date.now() })
  }

  // ── Full update (with Zod validation) ─────────────────────────────────────
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return err('Invalid JSON body', 400)
  }

  const parsed = updateAlertSchema.safeParse(body)
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

  const { data, error } = await db
    .from('alert_rules')
    .update(parsed.data)
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) return err(error.message)
  return NextResponse.json({ success: true, data, timestamp: Date.now() })
}

// ─── DELETE /api/alerts ───────────────────────────────────────────────────────
// ?id=uuid&type=rule   → delete alert rule
// ?id=uuid&type=event  → delete alert event
export async function DELETE(req: NextRequest) {
  let userId: string
  let db: ReturnType<typeof createServerClient>

  try {
    ;({ userId, db } = await setup(req))
  } catch (e) {
    if (e instanceof AuthError)
      return NextResponse.json({ success: false, message: e.message }, { status: 401 })
    return err('Authentication failed')
  }

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  const type = searchParams.get('type') // 'rule' | 'event'

  if (!id) return err('id query parameter is required', 400)

  const table = type === 'event' ? 'alert_events' : 'alert_rules'

  const { error } = await db
    .from(table)
    .delete()
    .eq('id', id)
    .eq('user_id', userId)

  if (error) return err(error.message)
  return NextResponse.json({ success: true, data: null, timestamp: Date.now() })
}
