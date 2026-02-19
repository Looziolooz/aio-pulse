// PATH: src/app/api/competitor/route.ts
import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { analyzeCompetitor } from '@/lib/services/gemini'
import { checkRateLimit, getClientIp } from '@/lib/ratelimit'

// ─── Validation ───────────────────────────────────────────────────────────────

const schema = z.object({
  primaryUrl: z.string().url('primaryUrl must be a valid URL'),
  competitorUrls: z
    .array(z.string().url('Each competitor URL must be valid'))
    .min(1, 'At least one competitor URL is required')
    .max(3, 'Maximum 3 competitor URLs allowed'),
})

// ─── POST /api/competitor ─────────────────────────────────────────────────────
// Fetches and analyzes the primary URL and up to 3 competitor URLs via Gemini.
// Rate limited: 10 requests per minute per IP (each call makes 4+ Gemini calls).
export async function POST(req: NextRequest) {
  // Rate limit — competitor analysis is expensive (fetches + Gemini calls per URL)
  const ip = getClientIp(req.headers)
  const rl = await checkRateLimit(`competitor:${ip}`, 10, 60_000)

  if (!rl.success) {
    return NextResponse.json(
      {
        success: false,
        message: `Rate limit exceeded. Try again in ${Math.ceil((rl.resetAt - Date.now()) / 1000)}s.`,
      },
      { status: 429 },
    )
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json(
      { success: false, message: 'Invalid JSON body' },
      { status: 400 },
    )
  }

  const parsed = schema.safeParse(body)
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

  const { primaryUrl, competitorUrls } = parsed.data

  try {
    // Analyze all URLs in parallel
    const [primary, ...competitors] = await Promise.all([
      analyzeCompetitor(primaryUrl),
      ...competitorUrls.map(analyzeCompetitor),
    ])

    return NextResponse.json({
      success: true,
      data: { primary, competitors },
      timestamp: Date.now(),
    })
  } catch (error: unknown) {
    console.error('[/api/competitor] Error:', error)
    const message = error instanceof Error ? error.message : 'Comparison failed'
    return NextResponse.json({ success: false, message }, { status: 500 })
  }
}
