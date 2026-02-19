import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerClient, getCurrentUserId } from '@/lib/supabase'
import { analyzeSentiment, detectHallucinations } from '@/lib/services/monitoring'

const schema = z.object({
  text: z.string().min(10).max(10000),
  brand_id: z.string().uuid(),
  mode: z.enum(['sentiment', 'hallucination', 'both']).default('both'),
  known_facts: z.array(z.string()).optional().default([]),
})

export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId(req.headers.get('authorization'))
  const db = createServerClient()

  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ success: false, message: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ success: false, message: 'Validation failed' }, { status: 422 })
  }

  const { text, brand_id, mode, known_facts } = parsed.data

  // Get brand
  const { data: brand } = await db
    .from('brands')
    .select('name')
    .eq('id', brand_id)
    .eq('user_id', userId)
    .single()

  if (!brand) return NextResponse.json({ success: false, message: 'Brand not found' }, { status: 404 })

  const result: Record<string, unknown> = {}

  await Promise.all([
    mode !== 'hallucination' &&
      analyzeSentiment(text, brand.name).then((s) => { result['sentiment'] = s }),
    mode !== 'sentiment' &&
      detectHallucinations(text, brand.name, known_facts).then((h) => { result['hallucination'] = h }),
  ].filter(Boolean))

  return NextResponse.json({ success: true, data: result, timestamp: Date.now() })
}

// GET: aggregate sentiment stats for a brand
export async function GET(req: NextRequest) {
  const userId = await getCurrentUserId(req.headers.get('authorization'))
  const db = createServerClient()
  const { searchParams } = new URL(req.url)
  const brandId = searchParams.get('brand_id')

  if (!brandId) {
    return NextResponse.json({ success: false, message: 'brand_id required' }, { status: 400 })
  }

  const { data, error } = await db
    .from('monitoring_results')
    .select('sentiment, sentiment_score, engine, has_hallucination, created_at, brand_mentioned')
    .eq('brand_id', brandId)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(200)

  if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 })

  const results = data ?? []
  const mentioned = results.filter((r) => r.brand_mentioned)

  const sentimentCounts = { positive: 0, negative: 0, neutral: 0 }
  let totalScore = 0
  for (const r of mentioned) {
    if (r.sentiment) sentimentCounts[r.sentiment as keyof typeof sentimentCounts]++
    if (r.sentiment_score != null) totalScore += r.sentiment_score
  }

  const avgSentimentScore = mentioned.length > 0 ? totalScore / mentioned.length : 0
  const hallucinationCount = results.filter((r) => r.has_hallucination).length
  const hallucinationRate = results.length > 0 ? hallucinationCount / results.length : 0

  const byEngine: Record<string, { avg: number; count: number }> = {}
  for (const r of mentioned) {
    if (!byEngine[r.engine]) byEngine[r.engine] = { avg: 0, count: 0 }
    byEngine[r.engine]!.avg += r.sentiment_score ?? 0
    byEngine[r.engine]!.count++
  }
  for (const eng of Object.keys(byEngine)) {
    const e = byEngine[eng]!
    e.avg = e.count > 0 ? e.avg / e.count : 0
  }

  return NextResponse.json({
    success: true,
    data: {
      sentimentCounts,
      avgSentimentScore,
      hallucinationCount,
      hallucinationRate,
      byEngine,
      totalResults: results.length,
      mentionedResults: mentioned.length,
    },
    timestamp: Date.now(),
  })
}
