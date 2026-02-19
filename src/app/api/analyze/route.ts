// PATH: src/app/api/analyze/route.ts
import { type NextRequest, NextResponse } from 'next/server'
import { analyzeTextSchema } from '@/lib/validations'
import { analyzeContent } from '@/lib/services/gemini'
import { checkRateLimit, getClientIp } from '@/lib/ratelimit'
import type { ApiResponse, AnalysisResult } from '@/types'

// ─── POST /api/analyze ────────────────────────────────────────────────────────
// Analyzes text or URL content for AIO visibility.
// Rate limited: 20 requests per minute per IP.
export async function POST(req: NextRequest) {
  // ── Rate limit ────────────────────────────────────────────────────────────
  const ip = getClientIp(req.headers)
  const rl = await checkRateLimit(ip, 20, 60_000)

  if (!rl.success) {
    return NextResponse.json(
      {
        success: false,
        message: `Rate limit exceeded. Try again in ${Math.ceil((rl.resetAt - Date.now()) / 1000)}s.`,
      },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': '20',
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(rl.resetAt),
          'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)),
        },
      },
    )
  }

  // ── Parse body ────────────────────────────────────────────────────────────
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ success: false, message: 'Invalid JSON body' }, { status: 400 })
  }

  // ── Validate ──────────────────────────────────────────────────────────────
  const parsed = analyzeTextSchema.safeParse(body)
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

  const { input, mode, engine } = parsed.data

  // ── Analyze ───────────────────────────────────────────────────────────────
  try {
    const result = await analyzeContent(input, mode, engine, input)

    const response: ApiResponse<AnalysisResult> = {
      data: result,
      success: true,
      message: 'Analysis complete',
      timestamp: Date.now(),
    }

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'X-RateLimit-Limit': '20',
        'X-RateLimit-Remaining': String(rl.remaining),
        'X-RateLimit-Reset': String(rl.resetAt),
      },
    })
  } catch (error: unknown) {
    console.error('[/api/analyze] Error:', error)
    const message = error instanceof Error ? error.message : 'Analysis failed'
    return NextResponse.json({ success: false, message }, { status: 500 })
  }
}

// ─── GET /api/analyze ─────────────────────────────────────────────────────────
export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'AIO Pulse Analyze API v2.0',
    endpoints: {
      'POST /api/analyze': 'Analyze text or URL content',
    },
  })
}
