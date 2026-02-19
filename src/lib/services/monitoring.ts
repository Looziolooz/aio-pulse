// PATH: src/lib/services/monitoring.ts
// VERSIONE AGGIORNATA — usa ai-router.ts per fallback automatico multi-provider.

import type {
  MonitoringEngine,
  MonitoringResult,
  Brand,
  Prompt,
  SentimentLabel,
  MentionType,
  CompetitorMention,
  HallucinationFlag,
} from '@/types'

import {
  simulateEngineResponse as routerSimulate,
  analyzeResponseForBrand as routerAnalyze,
} from './ai-router'

function parseJson<T>(raw: string): T {
  const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
  return JSON.parse(cleaned) as T
}

interface AnalysisOutput {
  brand_mentioned: boolean
  mention_position: number | null
  mention_count: number
  mention_type: MentionType
  visibility_score: number
  sentiment: SentimentLabel
  sentiment_score: number
  sentiment_reasoning: string
  cited_urls: string[]
  competitor_mentions: CompetitorMention[]
  has_hallucination: boolean
  hallucination_flags: HallucinationFlag[]
}

function buildAnalysisPrompt(responseText: string, brand: Brand, promptText: string): string {
  return `You are an AI brand monitoring analyst. Analyze this AI-generated response for mentions and sentiment about the brand "${brand.name}".

BRAND INFO:
- Primary name: ${brand.name}
- Aliases/variants: ${brand.aliases.join(', ') || 'none'}
- Domain: ${brand.domain || 'unknown'}
- Known competitors: ${brand.competitors.join(', ') || 'none'}

ORIGINAL PROMPT/QUERY: "${promptText}"

AI RESPONSE TO ANALYZE:
"""
${responseText.slice(0, 3000)}
"""

Respond ONLY with a valid JSON object (no markdown, no extra text):
{
  "brand_mentioned": <boolean>,
  "mention_position": <1-based integer position of first mention, or null>,
  "mention_count": <integer>,
  "mention_type": <"direct" | "indirect" | "none">,
  "visibility_score": <integer 0-100>,
  "sentiment": <"positive" | "negative" | "neutral">,
  "sentiment_score": <float -1.0 to 1.0>,
  "sentiment_reasoning": "<one sentence explanation>",
  "cited_urls": ["<url>"],
  "competitor_mentions": [
    {"name": "<n>", "position": <integer>, "count": <integer>}
  ],
  "has_hallucination": <boolean>,
  "hallucination_flags": [
    {
      "text": "<the potentially false claim>",
      "severity": <"low" | "medium" | "high">,
      "type": <"factual_error" | "attribution_error" | "fabrication" | "date_error">
    }
  ]
}`
}

// ─── runMonitoringCheck ───────────────────────────────────────────────────────

export async function runMonitoringCheck(
  prompt: Prompt,
  brand: Brand,
  engine: MonitoringEngine,
  userId: string,
): Promise<Omit<MonitoringResult, 'id' | 'created_at'>> {
  // Step 1: simula risposta engine
  const { text: responseText, provider: simulationProvider } =
    await routerSimulate(prompt.text, engine)
  console.log(`[monitoring] ${engine} simulato con: ${simulationProvider}`)

  // Step 2: analizza per metriche brand
  const analysisPrompt = buildAnalysisPrompt(responseText, brand, prompt.text)
  const { text: analysisRaw, provider: analysisProvider } =
    await routerAnalyze(analysisPrompt)
  console.log(`[monitoring] ${engine} analisi con: ${analysisProvider}`)

  let analysis: AnalysisOutput
  try {
    analysis = parseJson<AnalysisOutput>(analysisRaw)
  } catch {
    throw new Error(
      `Impossibile parsare la risposta di analisi da ${analysisProvider}. ` +
        `Raw: ${analysisRaw.slice(0, 200)}`,
    )
  }

  return {
    prompt_id: prompt.id,
    brand_id: brand.id,
    user_id: userId,
    engine,
    prompt_text: prompt.text,
    response_text:
      responseText.length > 5000 ? responseText.slice(0, 5000) + '…' : responseText,
    brand_mentioned: analysis.brand_mentioned,
    mention_position: analysis.mention_position,
    mention_count: analysis.mention_count,
    mention_type: analysis.mention_type,
    visibility_score: Math.min(100, Math.max(0, analysis.visibility_score)),
    sentiment: analysis.sentiment,
    sentiment_score: Math.min(1, Math.max(-1, analysis.sentiment_score)),
    cited_urls: analysis.cited_urls ?? [],
    competitor_mentions: analysis.competitor_mentions ?? [],
    has_hallucination: analysis.has_hallucination,
    hallucination_flags: analysis.hallucination_flags ?? [],
  }
}

// ─── analyzeSentiment ─────────────────────────────────────────────────────────

export interface SentimentResult {
  sentiment: SentimentLabel
  score: number
  confidence: number
  reasoning: string
  aspects: Array<{ aspect: string; sentiment: SentimentLabel; explanation: string }>
}

export async function analyzeSentiment(
  text: string,
  brandName: string,
): Promise<SentimentResult> {
  const prompt = `Analyze the sentiment of this text toward the brand "${brandName}".

TEXT:
"""
${text.slice(0, 4000)}
"""

Respond ONLY with valid JSON (no markdown):
{
  "sentiment": <"positive" | "negative" | "neutral">,
  "score": <float -1.0 to 1.0>,
  "confidence": <integer 0-100>,
  "reasoning": "<one paragraph explanation>",
  "aspects": [
    {
      "aspect": "<what aspect of the brand>",
      "sentiment": <"positive" | "negative" | "neutral">,
      "explanation": "<brief reason>"
    }
  ]
}`

  const { text: raw, provider } = await routerAnalyze(prompt)
  console.log(`[monitoring] analyzeSentiment con: ${provider}`)
  return parseJson<SentimentResult>(raw)
}

// ─── detectHallucinations ─────────────────────────────────────────────────────

export interface HallucinationResult {
  has_hallucination: boolean
  confidence: number
  flags: HallucinationFlag[]
  summary: string
}

export async function detectHallucinations(
  aiResponse: string,
  brandName: string,
  knownFacts: string[],
): Promise<HallucinationResult> {
  const factsBlock =
    knownFacts.length > 0
      ? `Known facts about ${brandName}:\n${knownFacts.map((f) => `- ${f}`).join('\n')}`
      : `No specific facts provided. Flag any claims that seem suspicious or unverifiable.`

  const prompt = `You are a fact-checking AI. Analyze this AI-generated response for potential hallucinations or factual errors about "${brandName}".

${factsBlock}

AI RESPONSE:
"""
${aiResponse.slice(0, 4000)}
"""

Respond ONLY with valid JSON (no markdown):
{
  "has_hallucination": <boolean>,
  "confidence": <integer 0-100>,
  "flags": [
    {
      "text": "<exact claim that may be false>",
      "severity": <"low" | "medium" | "high">,
      "type": <"factual_error" | "attribution_error" | "fabrication" | "date_error">
    }
  ],
  "summary": "<one paragraph overall assessment>"
}`

  const { text: raw, provider } = await routerAnalyze(prompt)
  console.log(`[monitoring] detectHallucinations con: ${provider}`)
  return parseJson<HallucinationResult>(raw)
}

// ─── calculateHealthScore ─────────────────────────────────────────────────────
// BUG FIX: versione corretta senza overflow negativo

export function calculateHealthScore(
  visibilityScore: number,    // 0 – 100
  sentimentScore: number,     // -1 – 1
  hallucinationRate: number,  // 0 – 1
): number {
  const sentimentNorm = ((sentimentScore + 1) / 2) * 100  // → 0-100
  const hallucinationPenalty = hallucinationRate * 30     // max 30 punti sottratti

  const raw =
    visibilityScore * 0.5 +
    sentimentNorm * 0.3 +
    (100 - hallucinationPenalty) * 0.2

  return Math.min(100, Math.max(0, Math.round(raw)))
}