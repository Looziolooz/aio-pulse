import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerClient, getCurrentUserId } from '@/lib/supabase'

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional().nullable(),
  domain: z.string().max(200).optional().nullable(),
  aliases: z.array(z.string()).max(10).optional(),
  domains: z.array(z.string()).max(20).optional(),
  competitors: z.array(z.string()).max(20).optional(),
  industry: z.string().max(100).optional().nullable(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  is_active: z.boolean().optional(),
})

interface Params { params: { id: string } }

export async function GET(req: NextRequest, { params }: Params) {
  const userId = await getCurrentUserId(req.headers.get('authorization'))
  const db = createServerClient()

  const { data, error } = await db
    .from('brands')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', userId)
    .single()

  if (error || !data) return NextResponse.json({ success: false, message: 'Brand not found' }, { status: 404 })
  return NextResponse.json({ success: true, data, timestamp: Date.now() })
}

export async function PUT(req: NextRequest, { params }: Params) {
  const userId = await getCurrentUserId(req.headers.get('authorization'))
  const db = createServerClient()

  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ success: false, message: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ success: false, message: 'Validation failed' }, { status: 422 })
  }

  const { data, error } = await db
    .from('brands')
    .update(parsed.data)
    .eq('id', params.id)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  return NextResponse.json({ success: true, data, timestamp: Date.now() })
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const userId = await getCurrentUserId(req.headers.get('authorization'))
  const db = createServerClient()

  const { error } = await db
    .from('brands')
    .delete()
    .eq('id', params.id)
    .eq('user_id', userId)

  if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  return NextResponse.json({ success: true, data: null, timestamp: Date.now() })
}
