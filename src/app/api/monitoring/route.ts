import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerClient, getCurrentUserId } from '@/lib/supabase'
import { runMonitoringCheck, calculateHealthScore } from '@/lib/services/monitoring'
import { shouldTriggerAlert, buildAlertEvent, dispatchAlert } from '@/lib/services/alerts'
import type { Brand, Prompt, MonitoringResult, AlertRule } from '@/types'

const runSchema = z.object({
  prompt_id: z.string().uuid(),
  engines: z.array(z.enum(['chatgpt', 'gemini', 'perplexity'])).optional(),
})

export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId(req.headers.get('authorization'))
  const db = createServerClient()

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ success: false, message: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = runSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ success: false, message: 'Validation failed' }, { status: 422 })
  }

  // Load prompt + brand
  const { data: prompt, error: promptError } = await db
    .from('prompts')
    .select('*, brand:brands(*)')
    .eq('id', parsed.data.prompt_id)
    .eq('user_id', userId)
    .single()

  if (promptError || !prompt) {
    return NextResponse.json({ success: false, message: 'Prompt not found' }, { status: 404 })
  }

  const brand = prompt.brand as Brand
  const enginesRaw = parsed.data.engines ?? (prompt.engines as string[])
  const engines = enginesRaw.filter((e) =>
    ['chatgpt', 'gemini', 'perplexity'].includes(e),
  ) as Array<'chatgpt' | 'gemini' | 'perplexity'>

  // Get previous results for comparison
  const { data: previousResults } = await db
    .from('monitoring_results')
    .select('*')
    .eq('prompt_id', prompt.id)
    .in('engine', engines)
    .order('created_at', { ascending: false })
    .limit(engines.length)

  const results: MonitoringResult[] = []

  // Run checks in parallel per engine
  const engineChecks = engines.map(async (engine) => {
    try {
      const resultData = await runMonitoringCheck(prompt as Prompt, brand, engine, userId)

      // Save to DB
      const { data: saved, error } = await db
        .from('monitoring_results')
        .insert(resultData)
        .select()
        .single()

      if (error || !saved) {
        console.error(`[monitoring] DB insert error for ${engine}:`, error)
        return
      }

      results.push(saved as MonitoringResult)

      // Check alert rules
      const { data: rules } = await db
        .from('alert_rules')
        .select('*')
        .eq('brand_id', brand.id)
        .eq('is_active', true)

      if (rules?.length) {
        const previousResult = (previousResults as MonitoringResult[])?.find(
          (r) => r.engine === engine,
        )

        for (const rule of rules as AlertRule[]) {
          const shouldFire = shouldTriggerAlert(rule, {
            result: saved as MonitoringResult,
            previousResult,
            brand,
          })

          if (shouldFire) {
            const event = buildAlertEvent(rule, saved as MonitoringResult, brand)

            // Save event
            const { data: savedEvent } = await db
              .from('alert_events')
              .insert({ ...event, user_id: userId })
              .select()
              .single()

            // Dispatch notifications
            if (savedEvent) {
              const channelsSent = await dispatchAlert(
                savedEvent as Parameters<typeof dispatchAlert>[0],
                rule,
                brand,
              )

              // Update channels_sent
              await db
                .from('alert_events')
                .update({ channels_sent: channelsSent })
                .eq('id', savedEvent.id)

              // Update last_fired_at on rule
              await db
                .from('alert_rules')
                .update({ last_fired_at: new Date().toISOString() })
                .eq('id', rule.id)
            }
          }
        }
      }
    } catch (err) {
      console.error(`[monitoring] Engine ${engine} failed:`, err)
    }
  })

  await Promise.all(engineChecks)

  // Update prompt last_run_at
  await db.from('prompts').update({ last_run_at: new Date().toISOString() }).eq('id', prompt.id)

  // Update brand health score
  if (results.length > 0) {
    const avgVisibility = results.reduce((a, r) => a + r.visibility_score, 0) / results.length
    const mentionedResults = results.filter((r) => r.brand_mentioned)
    const avgSentiment =
      mentionedResults.length > 0
        ? mentionedResults.reduce((a, r) => a + (r.sentiment_score ?? 0), 0) /
          mentionedResults.length
        : 0
    const hallucinationRate = results.filter((r) => r.has_hallucination).length / results.length
    const healthScore = calculateHealthScore(avgVisibility, avgSentiment, hallucinationRate)

    await db.from('brand_health_scores').upsert(
      {
        brand_id: brand.id,
        user_id: userId,
        date: new Date().toISOString().split('T')[0],
        visibility_score: avgVisibility,
        sentiment_score: avgSentiment,
        hallucination_rate: hallucinationRate,
        mention_count: results.filter((r) => r.brand_mentioned).length,
        health_score: healthScore,
      },
      { onConflict: 'brand_id,date' },
    )
  }

  return NextResponse.json({
    success: true,
    data: { results, enginesRun: engines.length },
    message: `Monitoring complete: ${results.length}/${engines.length} engines processed`,
    timestamp: Date.now(),
  })
}

// GET: fetch monitoring results
export async function GET(req: NextRequest) {
  const userId = await getCurrentUserId(req.headers.get('authorization'))
  const db = createServerClient()
  const { searchParams } = new URL(req.url)

  const brandId = searchParams.get('brand_id')
  const engine = searchParams.get('engine')
  const limit = parseInt(searchParams.get('limit') ?? '50')
  const page = parseInt(searchParams.get('page') ?? '1')
  const offset = (page - 1) * limit

  let query = db
    .from('monitoring_results')
    .select('*, prompt:prompts(text, category)', { count: 'exact' })
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (brandId) query = query.eq('brand_id', brandId)
  if (engine) query = query.eq('engine', engine)

  const { data, error, count } = await query

  if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 })

  return NextResponse.json({
    success: true,
    data,
    pagination: {
      page,
      perPage: limit,
      total: count ?? 0,
      totalPages: Math.ceil((count ?? 0) / limit),
    },
    timestamp: Date.now(),
  })
}
