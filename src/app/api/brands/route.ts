import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerClient, getCurrentUserId } from '@/lib/supabase'
import { slugify } from '@/lib/utils'

const brandSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  domain: z.string().max(200).optional(),
  aliases: z.array(z.string()).max(10).optional().default([]),
  domains: z.array(z.string()).max(20).optional().default([]),
  competitors: z.array(z.string()).max(20).optional().default([]),
  industry: z.string().max(100).optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional().default('#6366f1'),
})

export async function GET(req: NextRequest) {
  const userId = await getCurrentUserId(req.headers.get('authorization'))
  const db = createServerClient()

  const { data, error } = await db
    .from('brands')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

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

  const parsed = brandSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, message: 'Validation failed', details: parsed.error.flatten().fieldErrors },
      { status: 422 },
    )
  }

  const slug = slugify(parsed.data.name)

  const { data, error } = await db
    .from('brands')
    .insert({ ...parsed.data, user_id: userId, slug })
    .select()
    .single()

  if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  return NextResponse.json({ success: true, data, timestamp: Date.now() }, { status: 201 })
}
