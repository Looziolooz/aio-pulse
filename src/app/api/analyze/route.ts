import { type NextRequest, NextResponse } from 'next/server'
import { analyzeTextSchema } from '@/lib/validations'
import { analyzeContent } from '@/lib/services/gemini'
import type { ApiResponse, AnalysisResult } from '@/types'

const rateLimit = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(ip: string, limit = 20, windowMs = 60_000): boolean {
  const now = Date.now()
  const entry = rateLimit.get(ip)
  if (!entry || entry.resetAt < now) {
    rateLimit.set(ip, { count: 1, resetAt: now + windowMs })
    return true
  }
  if (entry.count >= limit) return false
  entry.count++
  return true
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown'
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { success: false, message: 'Rate limit exceeded. Try again in 1 minute.' },
      { status: 429 },
    )
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ success: false, message: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = analyzeTextSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, message: 'Validation failed', details: parsed.error.flatten().fieldErrors },
      { status: 422 },
    )
  }

  const { input, mode, engine } = parsed.data

  try {
    const result = await analyzeContent(input, mode, engine, input)
    const response: ApiResponse<AnalysisResult> = {
      data: result,
      success: true,
      message: 'Analysis complete',
      timestamp: Date.now(),
    }
    return NextResponse.json(response, { status: 200 })
  } catch (error: unknown) {
    console.error('[/api/analyze]', error)
    const message = error instanceof Error ? error.message : 'Analysis failed'
    return NextResponse.json({ success: false, message }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ success: true, message: 'AIO Pulse Analyze API v2.0' })
}
