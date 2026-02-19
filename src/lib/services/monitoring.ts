import type {
  MonitoringEngine, MonitoringResult, Brand, Prompt,
  SentimentLabel, MentionType, CompetitorMention, HallucinationFlag,
} from '@/types'
import { generateId } from '@/lib/utils'

// ─── Gemini caller ────────────────────────────────────────────────────────────

async function callGemini(prompt: string): Promise<string> {
  const apiKey = process.env['GEMINI_API_KEY']
  if (!apiKey) throw new Error('GEMINI_API_KEY not configured')

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.2, maxOutputTokens: 2048 },
    }),
  })

  if (!res.ok) throw new Error(`Gemini API error ${res.status}`)
  const data = await res.json() as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>
  }
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) throw new Error('Empty Gemini response')
  return text
}

function parseJson<T>(raw: string): T {
  const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
  return JSON.parse(cleaned) as T
}

// ─── Step 1: Simulate AI engine response ─────────────────────────────────────
// Since we can't call ChatGPT/Perplexity directly (no API access in free tier),
// we use Gemini to simulate how each engine would respond to the prompt,
// then analyze that response for brand mentions.

async function simulateEngineResponse(
  promptText: string,
  engine: MonitoringEngine,
  brandName: string,
): Promise<string> {
  const enginePersona: Record<MonitoringEngine, string> = {
    chatgpt: 'You are ChatGPT, a helpful AI assistant by OpenAI. Answer conversationally and helpfully.',
    gemini: 'You are Google Gemini, a helpful AI assistant. Answer factually with structured information.',
    perplexity: 'You are Perplexity AI, a search-focused AI assistant. Answer with facts and cite sources where possible.',
  }

  const systemPrompt = `${enginePersona[engine]}

The user is asking: "${promptText}"

Provide a realistic, helpful response as this AI system would. Include relevant brands, products, and services in your answer as appropriate. Keep it 150-300 words.`

  return callGemini(systemPrompt)
}

// ─── Step 2: Analyze response for brand metrics ───────────────────────────────

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

async function analyzeResponseForBrand(
  responseText: string,
  brand: Brand,
  promptText: string,
): Promise<AnalysisOutput> {
  const prompt = `You are an AI brand monitoring analyst. Analyze this AI-generated response for mentions and sentiment about the brand "${brand.name}".

BRAND INFO:
- Primary name: ${brand.name}
- Aliases/variants: ${brand.aliases.join(', ') || 'none'}
- Domain: ${brand.domain || 'unknown'}
- Known competitors: ${brand.competitors.join(', ') || 'none'}

ORIGINAL PROMPT/QUERY: "${promptText}"

AI RESPONSE TO ANALYZE:
"""
${responseText}
"""

Respond ONLY with a valid JSON object (no markdown):
{
  "brand_mentioned": <boolean>,
  "mention_position": <1-based position of first mention, or null if not mentioned>,
  "mention_count": <number of times brand is mentioned>,
  "mention_type": <"direct" | "indirect" | "none">,
  "visibility_score": <0-100, how prominently featured>,
  "sentiment": <"positive" | "negative" | "neutral">,
  "sentiment_score": <-1.0 to 1.0>,
  "sentiment_reasoning": "<why this sentiment>",
  "cited_urls": ["<any URLs mentioned>"],
  "competitor_mentions": [
    {"name": "<competitor name>", "position": <1-based>, "count": <mentions>}
  ],
  "has_hallucination": <boolean>,
  "hallucination_flags": [
    {
      "text": "<the potentially false claim>",
      "severity": <"low"|"medium"|"high">,
      "type": <"factual_error"|"attribution_error"|"fabrication"|"date_error">
    }
  ]
}`

  const raw = await callGemini(prompt)
  return parseJson<AnalysisOutput>(raw)
}

// ─── Main: run one prompt on one engine ──────────────────────────────────────

export async function runMonitoringCheck(
  prompt: Prompt,
  brand: Brand,
  engine: MonitoringEngine,
  userId: string,
): Promise<Omit<MonitoringResult, 'id' | 'created_at'>> {
  // 1. Simulate engine response
  const responseText = await simulateEngineResponse(prompt.text, engine, brand.name)

  // 2. Analyze for brand metrics
  const analysis = await analyzeResponseForBrand(responseText, brand, prompt.text)

  return {
    prompt_id: prompt.id,
    brand_id: brand.id,
    user_id: userId,
    engine,
    prompt_text: prompt.text,
    response_text: responseText,
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

// ─── Sentiment analyzer (standalone) ─────────────────────────────────────────

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

Respond ONLY with JSON:
{
  "sentiment": <"positive"|"negative"|"neutral">,
  "score": <-1.0 to 1.0>,
  "confidence": <0-100>,
  "reasoning": "<brief explanation>",
  "aspects": [
    {"aspect": "<what aspect>", "sentiment": <"positive"|"negative"|"neutral">, "explanation": "<why>"}
  ]
}`

  const raw = await callGemini(prompt)
  return parseJson<SentimentResult>(raw)
}

// ─── Hallucination detector (standalone) ─────────────────────────────────────

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
  const factsBlock = knownFacts.length > 0
    ? `Known facts about ${brandName}:\n${knownFacts.map((f) => `- ${f}`).join('\n')}`
    : `No specific facts provided. Flag any claims that seem suspicious or unverifiable.`

  const prompt = `You are a fact-checking AI. Analyze this AI-generated response for potential hallucinations or factual errors about "${brandName}".

${factsBlock}

AI RESPONSE:
"""
${aiResponse.slice(0, 4000)}
"""

Respond ONLY with JSON:
{
  "has_hallucination": <boolean>,
  "confidence": <0-100, how confident you are>,
  "flags": [
    {
      "text": "<the exact claim that may be false>",
      "severity": <"low"|"medium"|"high">,
      "type": <"factual_error"|"attribution_error"|"fabrication"|"date_error">
    }
  ],
  "summary": "<brief overall assessment>"
}`

  const raw = await callGemini(prompt)
  return parseJson<HallucinationResult>(raw)
}

// ─── Brand health score calculator ────────────────────────────────────────────

export function calculateHealthScore(
  visibilityScore: number,
  sentimentScore: number,    // -1 to 1
  hallucinationRate: number, // 0 to 1
): number {
  // Normalize sentiment from -1..1 to 0..100
  const sentimentNorm = ((sentimentScore + 1) / 2) * 100
  // Hallucination penalty: 0 = perfect, 1 = total failure
  const hallucinationPenalty = hallucinationRate * 30 // max 30 point deduction
  // Weighted composite
  const raw = visibilityScore * 0.5 + sentimentNorm * 0.3 + (100 - hallucinationPenalty * 100) * 0.2
  return Math.min(100, Math.max(0, Math.round(raw)))
}
