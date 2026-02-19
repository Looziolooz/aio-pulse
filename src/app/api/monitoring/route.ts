// PATH: src/app/api/monitoring/route.ts
import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerClient, getCurrentUserId, AuthError } from '@/lib/supabase'
import { runMonitoringCheck, calculateHealthScore } from '@/lib/services/monitoring'
import { shouldTriggerAlert, buildAlertEvent, dispatchAlert } from '@/lib/services/alerts'
import type { Brand, Prompt, MonitoringResult, AlertRule } from '@/types'

// ─── Validation ───────────────────────────────────────────────────────────────

const runSchema = z.object({
  prompt_id: z.string().uuid(),
  engines: z
    .array(z.enum(['chatgpt', 'gemini', 'perplexity']))
    .min(1)
    .max(3)
    .optional(),
})

function err(message: string, status = 500) {
  return NextResponse.json({ success: false, message }, { status })
}

// ─── POST /api/monitoring ─────────────────────────────────────────────────────
// Runs a monitoring check for a prompt across one or more AI engines.
// Saves results, evaluates alert rules, and dispatches notifications.
//
// NOTE: Each engine run = 2 Gemini calls (simulate + analyze).
//       Engines run in parallel but we cap at 3 to avoid rate limiting.
export async function POST(req: NextRequest) {
  let userId: string
  try {
    userId = await getCurrentUserId(req.headers.get('authorization'))
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

  const parsed = runSchema.safeParse(body)
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

  const db = createServerClient()

  // ── Load prompt + brand ───────────────────────────────────────────────────
  const { data: prompt, error: promptError } = await db
    .from('prompts')
    .select('*, brand:brands(*)')
    .eq('id', parsed.data.prompt_id)
    .eq('user_id', userId)
    .single()

  if (promptError || !prompt) {
    return err('Prompt not found or access denied', 404)
  }

  const brand = prompt.brand as Brand

  // ── Resolve engines ───────────────────────────────────────────────────────
  const validEngines = ['chatgpt', 'gemini', 'perplexity'] as const
  type Engine = typeof validEngines[number]

  const requestedEngines = parsed.data.engines ?? (prompt.engines as string[])
  const engines = requestedEngines.filter((e): e is Engine =>
    (validEngines as readonly string[]).includes(e),
  )

  if (engines.length === 0) {
    return err('No valid engines specified', 400)
  }

  // ── Fetch previous results for change detection ───────────────────────────
  const { data: previousResults } = await db
    .from('monitoring_results')
    .select('*')
    .eq('prompt_id', prompt.id)
    .in('engine', engines)
    .order('created_at', { ascending: false })
    .limit(engines.length)

  const results: MonitoringResult[] = []
  const errors: string[] = []

  // ── Run engines in parallel (capped at 3 by schema validation) ────────────
  await Promise.all(
    engines.map(async (engine) => {
      try {
        // Truncate response_text before saving to prevent unbounded DB growth
        const resultData = await runMonitoringCheck(prompt as Prompt, brand, engine, userId)
        const truncatedData = {
          ...resultData,
          response_text:
            resultData.response_text.length > 5000
              ? resultData.response_text.slice(0, 5000) + '…'
              : resultData.response_text,
        }

        const { data: saved, error: insertError } = await db
          .from('monitoring_results')
          .insert(truncatedData)
          .select()
          .single()

        if (insertError || !saved) {
          console.error(`[monitoring] DB insert error for ${engine}:`, insertError)
          errors.push(`${engine}: DB insert failed`)
          return
        }

        results.push(saved as MonitoringResult)

        // ── Evaluate alert rules ────────────────────────────────────────────
        const { data: rules } = await db
          .from('alert_rules')
          .select('*')
          .eq('brand_id', brand.id)
          .eq('is_active', true)

        if (rules && rules.length > 0) {
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

              const { data: savedEvent } = await db
                .from('alert_events')
                .insert({ ...event, user_id: userId })
                .select()
                .single()

              if (savedEvent) {
                const channelsSent = await dispatchAlert(
                  savedEvent as Parameters<typeof dispatchAlert>[0],
                  rule,
                  brand,
                )

                await db
                  .from('alert_events')
                  .update({ channels_sent: channelsSent })
                  .eq('id', savedEvent.id)

                await db
                  .from('alert_rules')
                  .update({ last_fired_at: new Date().toISOString() })
                  .eq('id', rule.id)
              }
            }
          }
        }
      } catch (engineErr) {
        const msg = engineErr instanceof Error ? engineErr.message : String(engineErr)
        console.error(`[monitoring] Engine ${engine} failed:`, engineErr)
        errors.push(`${engine}: ${msg}`)
      }
    }),
  )

  // ── Update prompt last_run_at ─────────────────────────────────────────────
  await db
    .from('prompts')
    .update({ last_run_at: new Date().toISOString() })
    .eq('id', prompt.id)

  // ── Upsert daily brand health score ──────────────────────────────────────
  if (results.length > 0) {
    const avgVisibility =
      results.reduce((a, r) => a + r.visibility_score, 0) / results.length

    const mentionedResults = results.filter((r) => r.brand_mentioned)
    const avgSentiment =
      mentionedResults.length > 0
        ? mentionedResults.reduce((a, r) => a + (r.sentiment_score ?? 0), 0) /
          mentionedResults.length
        : 0

    const hallucinationRate =
      results.filter((r) => r.has_hallucination).length / results.length

    const healthScore = calculateHealthScore(avgVisibility, avgSentiment, hallucinationRate)

    await db.from('brand_health_scores').upsert(
      {
        brand_id: brand.id,
        user_id: userId,
        date: new Date().toISOString().split('T')[0],
        visibility_score: avgVisibility,
        sentiment_score: avgSentiment,
        hallucination_rate: hallucinationRate,
        mention_count: mentionedResults.length,
        health_score: healthScore,
      },
      { onConflict: 'brand_id,date' },
    )
  }

  return NextResponse.json({
    success: true,
    data: {
      results,
      enginesRun: engines.length,
      enginesSucceeded: results.length,
      enginesFailed: errors.length,
      errors: errors.length > 0 ? errors : undefined,
    },
    message: `Monitoring complete: ${results.length}/${engines.length} engines succeeded`,
    timestamp: Date.now(),
  })
}

// ─── GET /api/monitoring ──────────────────────────────────────────────────────
// Returns paginated monitoring results.
// ?brand_id=uuid   → filter by brand
// ?engine=chatgpt  → filter by engine
// ?limit=50        → page size (max 100)
// ?page=1          → page number
export async function GET(req: NextRequest) {
  let userId: string
  try {
    userId = await getCurrentUserId(req.headers.get('authorization'))
  } catch (e) {
    if (e instanceof AuthError)
      return NextResponse.json({ success: false, message: e.message }, { status: 401 })
    return err('Authentication failed')
  }

  const db = createServerClient()
  const { searchParams } = new URL(req.url)

  const brandId = searchParams.get('brand_id')
  const engine = searchParams.get('engine')
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '50')))
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
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

  if (error) return err(error.message)

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
