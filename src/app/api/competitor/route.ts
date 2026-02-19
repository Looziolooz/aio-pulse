import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { analyzeCompetitor } from '@/lib/services/gemini'

const schema = z.object({
  primaryUrl: z.string().url(),
  competitorUrls: z.array(z.string().url()).min(1).max(3),
})

export async function POST(req: NextRequest) {
  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ success: false, message: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ success: false, message: 'Validation failed' }, { status: 422 })
  }

  const { primaryUrl, competitorUrls } = parsed.data

  try {
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
    const message = error instanceof Error ? error.message : 'Comparison failed'
    return NextResponse.json({ success: false, message }, { status: 500 })
  }
}
