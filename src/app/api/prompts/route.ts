import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerClient, getCurrentUserId } from '@/lib/supabase'

const promptSchema = z.object({
  brand_id: z.string().uuid(),
  text: z.string().min(5).max(500),
  language: z.string().default('en'),
  market: z.string().default('global'),
  category: z.enum(['awareness', 'comparison', 'alternative', 'features', 'custom']).optional(),
  engines: z.array(z.enum(['chatgpt', 'gemini', 'perplexity'])).default(['chatgpt', 'gemini', 'perplexity']),
  run_frequency: z.enum(['hourly', 'daily', 'weekly']).default('daily'),
})

export async function GET(req: NextRequest) {
  const userId = await getCurrentUserId(req.headers.get('authorization'))
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

  const parsed = promptSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, message: 'Validation failed', details: parsed.error.flatten().fieldErrors },
      { status: 422 },
    )
  }

  // Verify brand belongs to user
  const { data: brand } = await db
    .from('brands')
    .select('id')
    .eq('id', parsed.data.brand_id)
    .eq('user_id', userId)
    .single()

  if (!brand) return NextResponse.json({ success: false, message: 'Brand not found' }, { status: 404 })

  const { data, error } = await db
    .from('prompts')
    .insert({ ...parsed.data, user_id: userId })
    .select()
    .single()

  if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  return NextResponse.json({ success: true, data, timestamp: Date.now() }, { status: 201 })
}

export async function DELETE(req: NextRequest) {
  const userId = await getCurrentUserId(req.headers.get('authorization'))
  const db = createServerClient()
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ success: false, message: 'id required' }, { status: 400 })

  const { error } = await db.from('prompts').delete().eq('id', id).eq('user_id', userId)
  if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  return NextResponse.json({ success: true, data: null, timestamp: Date.now() })
}
